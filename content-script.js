const MONTHS = [
    "Tammikuu",
    "Helmikuu",
    "Maaliskuu",
    "Huhtikuu",
    "Toukokuu",
    "Kesäkuu",
    "Heinäkuu",
    "Elokuu",
    "Syyskuu",
    "Lokakuu",
    "Marraskuu",
    "Joulukuu"
]
function getCookie(name="__wtoken") {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function getElement() {
    const el = $("<div class='wolt-stats'></div>")
    el.append("<h1>Wolt statsit</h1>")
    const cont = $("<div id='stats' style='display:none'></div>")
    cont.append("<p><b>Tilaukset: <span id='wolt-stats-count'></span></b></p>")
    cont.append("<p><b>Rahaa tuhlattu: <span id='wolt-stats-price'></span></b></p>")
    cont.append("<p><b>Per tilaus: <span id='wolt-stats-orderPrice'></span></b></p>")
    cont.append("<p><b>Tuotteisiin: <span id='wolt-stats-itemPrice'></span></b></p>")
    cont.append("<p><b>Kuljetuksiin: <span id='wolt-stats-deliveryPrice'></span></b></p>")
    cont.append("<p><b>Wolt palkkiot: <span id='wolt-stats-woltPrice'></span></b></p>")
    cont.append("<p class='delimeter'>Kuluva vuosi</p>")
    cont.append("<div id='months'></div>")
    el.append(cont)
    el.append("<p id='stats-login'><b>Kirjaudu sisään</b></p>")
    el.append("<p id='stats-loading' style='display: none;'><b>Ladataan tietoja ...</b></p>")
    return el
}
$("body").prepend(getElement())

function sortMonths(data) {
    const results = {}
    for(order of data) {
        const key = order.month + "-" + order.year
        if(Object.keys(results).indexOf(key) == -1) {
            results[key] = {price:0}
        }
        results[key].price += order.price
    }
    return results;
}


function displayResults(data) {
    let price = 0;
    let itemPrices = 0;
    let deliveryPrices = 0;
    let woltPrice = 0;
    let thisMonth = null;
    let lastMonth = null;
    let thirdMonth = null;
    for(order of data) {
        price += order.price;
        itemPrices += order.itemPrices;
        deliveryPrices += order.deliveryPrices;
        woltPrice += order.woltPrice;
    }
    let months = sortMonths(data)
    const year = new Date().getFullYear();
    for(key in months) {
        const sp = key.split("-")
        if(sp[1] == year) {
            price += months[key].price
            const el = $("<p><b>" + MONTHS[parseInt(sp[0]) - 1] + " " + year + ": " + months[key].price / 100 + "€</b></p>")
            $("#stats #months").append(el)
        }
    }
    $("#wolt-stats-count").html(data.length)
    $("#wolt-stats-price").html((price / 100) + "€")
    $("#wolt-stats-orderPrice").html(((price / data.length) / 100).toFixed(2) + "€")
    $("#wolt-stats-itemPrice").html((itemPrices / 100) + "€")
    $("#wolt-stats-deliveryPrice").html((deliveryPrices / 100) + "€")
    $("#wolt-stats-woltPrice").html((woltPrice / 100) + "€")
   
    $("#stats-loading").hide();
    $("#stats").show();
}
function scrape(authToken) {
    $("#stats-login").hide();
    $("#stats-loading").show();
    const results = []
    const interval = setInterval(function() {
        const authToken = getCookie();
        if(authToken == undefined) {
            clearInterval(interval)
            start();
        }
    }, 200)
    function request(skip = 0) {
        $.ajax({
            url: "https://restaurant-api.wolt.com/v2/order_details/?limit=100&skip=" + skip,
            headers: {
                Authorization: "bearer " + authToken
            },
            success: function(data) {
                for(order of data) {
                    woltPrice = 0;
                    if(Object.keys(order).indexOf("service_fee") > -1) {
                        woltPrice = order.service_fee
                    }
                    var date = new Date(order.payment_time.$date);
                    dsp = date.toLocaleString().split("/");
                    results.push({
                        price: order.total_price,
                        itemPrices: order.items_price,
                        deliveryPrices: order.delivery_price,
                        woltPrice: woltPrice,
                        year: dsp[2].split(",")[0],
                        day: dsp[1],
                        month: dsp[0]
                    })
                }
                if(data.length == 100) {
                    request(skip + 100)
                } else {
                    //last page
                    displayResults(results)
                }
            }
        })
    }
    request();
}

function start() {
    $("#stats-login").show();
    $("#stats-loading").hide();
    $("#stats").hide();
    let authCookie = getCookie()
    let interval = null;
    if(authCookie == undefined) {
        interval = setInterval(function() {
            authCookie = getCookie();
            if(authCookie != undefined) {
                clearInterval(interval)
                scrape(JSON.parse(unescape(authCookie))["accessToken"])
            }
        }, 200)
    } else {
        scrape(JSON.parse(unescape(authCookie))["accessToken"])
    }
}
start();