(function () {
  var API = "https://player.pandavideo.com.br/api.v2.js";
  var pageKey = "front";

  var s = document.currentScript;
  if (s && s.getAttribute("data-fcd-panda")) {
    pageKey = s.getAttribute("data-fcd-panda");
  }

  function assetBase() {
    if (s && s.src) {
      try {
        return new URL(".", s.src).href;
      } catch (e) {}
    }
    return "/funnel/";
  }

  function loadApi(cb) {
    if (window.PandaPlayer) {
      cb();
      return;
    }
    var existing = document.querySelector('script[src="' + API + '"]');
    if (existing) {
      existing.addEventListener("load", cb);
      return;
    }
    var tag = document.createElement("script");
    tag.src = API;
    tag.async = true;
    tag.onload = cb;
    document.head.appendChild(tag);
  }

  function showUpsellCta(id) {
    var el = document.getElementById(id);
    if (el && el.style.display !== "block") {
      el.style.display = "block";
    }
  }

  function wirePlayer(cfg) {
    var pitch = Number(cfg.pitchSeconds) || 0;
    var fired = false;

    function onPitch() {
      if (fired) return;
      fired = true;
      if (cfg.ctaContainerId) {
        showUpsellCta(cfg.ctaContainerId);
      }
      document.dispatchEvent(new CustomEvent("fcd:show-cta"));
    }

    if (pitch <= 0 || /(?:\?|&)fcd_cta_now=1(?:&|$)/.test(window.location.search)) {
      onPitch();
      return;
    }

    window.pandascripttag = window.pandascripttag || [];
    window.pandascripttag.push(function () {
      var player = new PandaPlayer(cfg.iframeId, {
        onReady: function () {
          player.onEvent(function (e) {
            if (!e || e.message !== "panda_timeupdate") return;
            var t = Number(e.currentTime);
            if (t >= pitch) onPitch();
          });
        },
      });
    });

    setTimeout(function () {
      if (!fired) onPitch();
    }, pitch * 1000);
  }

  function init() {
    fetch(assetBase() + "video-panda.json", { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        var cfg = j[pageKey];
        if (!cfg || !cfg.iframeId) return;
        loadApi(function () {
          wirePlayer(cfg);
        });
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
