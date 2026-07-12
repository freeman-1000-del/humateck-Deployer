(function () {
  "use strict";

  function hidePricingAndBuy() {
    if (document.getElementById("humateckProductPureStyles")) return;
    var style = document.createElement("style");
    style.id = "humateckProductPureStyles";
    style.textContent =
      "#webBuyHero,.webBuyHeroBtn,.launchRibbon,#heroPricingBadge,#heroPricingHookHost{display:none!important}" +
      "body.humateck-open-practice .webBuyHero,body.humateck-pure-product .webBuyHero{display:none!important}" +
      ".planHookNote,[data-humateck-price-table],.priceOff,.priceList,.priceSale,.heroHook,.pricingCurrencyNote,.launchBadge{display:none!important}" +
      "a[href*='buy-en'],a[href*='buy.html']{display:none!important}";
    document.head.appendChild(style);
  }

  function softenCopy() {
    var sub = document.querySelector(".orderLeftColumn .card:first-child .subtitle");
    if (sub) {
      sub.textContent =
        "Web demo · translation workflow · Google OAuth practice · full registration in the PC desktop app";
    }

    var note = document.querySelector(".serviceNote");
    if (note) {
      note.innerHTML =
        "<strong>[Note]</strong> This page is a product demo for translation workflow and Google OAuth setup. " +
        "Full YouTube multilingual registration runs in the <strong>PC desktop app</strong> included with the service.";
    }

    var btn = document.getElementById("sendOrderBtn");
    if (btn) {
      btn.title = "Full registration is available in the PC desktop app";
    }
  }

  function run() {
    hidePricingAndBuy();
    softenCopy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  setTimeout(run, 400);
})();
