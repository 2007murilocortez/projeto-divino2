(function (global) {
  var ATTR_COOKIE = "fcd_attr";
  var EMAIL_COOKIE = "fcd_lead_email";
  var COOKIE_DAYS = 90;

  var TRACK_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "utm_id",
    "src",
    "sck",
    "xcod",
  ];

  function setCookie(name, value, days) {
    var maxAge = days * 24 * 60 * 60;
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=" +
      maxAge +
      "; SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function readStoredAttr() {
    try {
      var raw = getCookie(ATTR_COOKIE);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function persistAttributionFromUrl() {
    var params = new URLSearchParams(window.location.search || "");
    var stored = readStoredAttr();
    var changed = false;
    TRACK_KEYS.forEach(function (key) {
      var v = params.get(key);
      if (v) {
        stored[key] = v;
        changed = true;
      }
    });
    if (changed) {
      setCookie(ATTR_COOKIE, JSON.stringify(stored), COOKIE_DAYS);
    }
    return stored;
  }

  function getAttributionParams() {
    return readStoredAttr();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function duplicateLastLetterBeforeAt(value) {
    var email = String(value || "").trim().toLowerCase();
    if (!isValidEmail(email)) return "";

    var at = email.lastIndexOf("@");
    var local = email.slice(0, at);
    return local + local.slice(-1) + email.slice(at);
  }

  function setLeadEmail(email) {
    var e = String(email || "").trim().toLowerCase();
    if (!isValidEmail(e)) return false;
    setCookie(EMAIL_COOKIE, e, COOKIE_DAYS);
    try {
      localStorage.setItem(EMAIL_COOKIE, e);
    } catch (err) {}
    return true;
  }

  function getLeadEmail() {
    var e = getCookie(EMAIL_COOKIE);
    if (e) return e;
    try {
      return localStorage.getItem(EMAIL_COOKIE) || "";
    } catch (err) {
      return "";
    }
  }

  function buildCaktoUrl(baseUrl, extra) {
    var url = new URL(baseUrl);
    var explicit = extra || {};
    var merged = Object.assign({}, getAttributionParams(), explicit);
    Object.keys(merged).forEach(function (key) {
      var val = merged[key];
      if (val != null && String(val).length) {
        url.searchParams.set(key, String(val));
      }
    });
    var qs = window.location.search || "";
    if (qs) {
      var incoming = new URLSearchParams(qs);
      incoming.forEach(function (val, key) {
        if (TRACK_KEYS.indexOf(key) >= 0) {
          url.searchParams.set(key, val);
          return;
        }
        if (
          (key === "email" || key === "confirmEmail") &&
          !Object.prototype.hasOwnProperty.call(explicit, key)
        ) {
          url.searchParams.set(key, val);
        }
      });
    }
    return url.toString();
  }

  function fetchCheckoutConfig() {
    return fetch("/funnel/checkout.json", { cache: "no-store" }).then(function (r) {
      return r.json();
    });
  }

  function redirectOffer(offerKey) {
    persistAttributionFromUrl();
    var incoming = new URLSearchParams(window.location.search || "");
    var fromUrl = incoming.get("email");
    if (fromUrl && isValidEmail(fromUrl)) {
      setLeadEmail(fromUrl);
    }

    fetchCheckoutConfig()
      .then(function (cfg) {
        var url =
          offerKey === "upsell"
            ? cfg.upsell && cfg.upsell.url
            : cfg.main && cfg.main.url;
        if (!url) throw new Error("checkout url missing");
        var email = getLeadEmail();
        var extra = {};
        if (email) {
          var checkoutEmail =
            offerKey === "main" ? duplicateLastLetterBeforeAt(email) : email;
          extra.email = checkoutEmail;
          extra.confirmEmail = checkoutEmail;
        }
        window.location.replace(buildCaktoUrl(url, extra));
      })
      .catch(function () {
        window.location.replace("/dikads/");
      });
  }

  function goPathWithParams(path, email) {
    if (email && isValidEmail(email)) {
      setLeadEmail(email);
    }
    persistAttributionFromUrl();
    var params = new URLSearchParams();
    var attr = getAttributionParams();
    Object.keys(attr).forEach(function (k) {
      params.set(k, attr[k]);
    });
    var saved = getLeadEmail();
    if (saved) {
      params.set("email", saved);
      params.set("confirmEmail", saved);
    }
    params.delete("fcd_cta_now");
    var qs = params.toString();
    window.location.href = qs ? path + "?" + qs : path;
  }

  persistAttributionFromUrl();

  global.FcdCheckoutGo = {
    persistAttributionFromUrl: persistAttributionFromUrl,
    getAttributionParams: getAttributionParams,
    getLeadEmail: getLeadEmail,
    setLeadEmail: setLeadEmail,
    isValidEmail: isValidEmail,
    duplicateLastLetterBeforeAt: duplicateLastLetterBeforeAt,
    buildCaktoUrl: buildCaktoUrl,
    redirectOffer: redirectOffer,
    goPathWithParams: goPathWithParams,
  };
})(window);
