(function () {
  var cfg = {
    goPath: "/go/main",
    ctaDelaySeconds: 1719,
    ctaLabel: "QUERO GARANTIR MINHA VAGA",
    ctaSub: "",
    captureEmail: true,
    emailPlaceholder: "seu@email.com",
    modalTitle: "Quase lá — reserve seu acesso",
    modalSub: "Usamos seu e-mail apenas para liberar seu acesso ao programa.",
    modalBadge: "Último passo",
    modalSubmitLabel: "Continuar para o checkout",
    modalFinePrint: "No checkout, seus dados já vêm preenchidos para você finalizar mais rápido.",
  };

  var modalEl = null;
  var emailInput = null;
  var checkoutPath = "/go/main";

  function assetBase() {
    var s = document.currentScript;
    if (s && s.src) {
      try {
        return new URL(".", s.src).href;
      } catch (e) {}
    }
    return window.location.origin + "/funnel/";
  }

  function ensureStyles() {
    if (document.getElementById("fcd-cta-modal-css")) return;
    var link = document.createElement("link");
    link.id = "fcd-cta-modal-css";
    link.rel = "stylesheet";
    link.href = assetBase() + "cta-modal.css";
    document.head.appendChild(link);
  }

  function show(wrap) {
    if (!wrap || wrap.classList.contains("fcd-cta--visible")) return;
    wrap.classList.add("fcd-cta--visible");
    wrap.setAttribute("aria-hidden", "false");
  }

  function goCheckout(path, email) {
    var go = window.FcdCheckoutGo;
    if (!go) {
      window.location.href = path;
      return;
    }
    if (cfg.captureEmail && email) {
      if (!go.isValidEmail(email)) return false;
      go.setLeadEmail(email);
    }
    go.goPathWithParams(path);
    return true;
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove("fcd-lead-modal--open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("fcd-lead-modal-open");
  }

  function openModal() {
    if (!modalEl) return;
    ensureStyles();
    modalEl.classList.add("fcd-lead-modal--open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("fcd-lead-modal-open");
    var saved = window.FcdCheckoutGo && window.FcdCheckoutGo.getLeadEmail();
    if (emailInput) {
      emailInput.value = saved || "";
      emailInput.removeAttribute("aria-invalid");
      var err = modalEl.querySelector(".fcd-lead-modal__error");
      if (err) err.textContent = "";
      window.setTimeout(function () {
        emailInput.focus();
      }, 120);
    }
  }

  function ensureModal() {
    if (document.getElementById("fcd-lead-modal")) {
      modalEl = document.getElementById("fcd-lead-modal");
      emailInput = document.getElementById("fcd-lead-modal-email");
      return;
    }

    modalEl = document.createElement("div");
    modalEl.id = "fcd-lead-modal";
    modalEl.className = "fcd-lead-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "fcd-lead-modal-title");
    modalEl.setAttribute("aria-hidden", "true");

    modalEl.innerHTML =
      '<div class="fcd-lead-modal__backdrop" data-fcd-close></div>' +
      '<div class="fcd-lead-modal__panel">' +
      '<button type="button" class="fcd-lead-modal__close" data-fcd-close aria-label="Fechar">&times;</button>' +
      '<span class="fcd-lead-modal__badge"></span>' +
      '<h2 id="fcd-lead-modal-title" class="fcd-lead-modal__title"></h2>' +
      '<p class="fcd-lead-modal__sub"></p>' +
      '<form class="fcd-lead-modal__form" novalidate>' +
      '<label class="fcd-lead-modal__label" for="fcd-lead-modal-email">E-mail</label>' +
      '<input class="fcd-lead-modal__input" id="fcd-lead-modal-email" name="email" type="email" autocomplete="email" inputmode="email" required />' +
      '<p class="fcd-lead-modal__error" role="alert"></p>' +
      '<button type="submit" class="fcd-lead-modal__submit"></button>' +
      "</form>" +
      '<p class="fcd-lead-modal__fine"></p>' +
      "</div>";

    document.body.appendChild(modalEl);
    emailInput = document.getElementById("fcd-lead-modal-email");

    modalEl.querySelector(".fcd-lead-modal__badge").textContent = cfg.modalBadge;
    modalEl.querySelector(".fcd-lead-modal__title").textContent = cfg.modalTitle;
    modalEl.querySelector(".fcd-lead-modal__sub").textContent = cfg.modalSub;
    emailInput.placeholder = cfg.emailPlaceholder;
    modalEl.querySelector(".fcd-lead-modal__submit").textContent = cfg.modalSubmitLabel;
    modalEl.querySelector(".fcd-lead-modal__fine").textContent = cfg.modalFinePrint;

    modalEl.querySelectorAll("[data-fcd-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalEl.classList.contains("fcd-lead-modal--open")) {
        closeModal();
      }
    });

    modalEl.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var go = window.FcdCheckoutGo;
      var errEl = modalEl.querySelector(".fcd-lead-modal__error");
      var email = emailInput.value.trim();
      if (!go || !go.isValidEmail(email)) {
        emailInput.setAttribute("aria-invalid", "true");
        if (errEl) errEl.textContent = "Digite um e-mail válido para continuar.";
        emailInput.focus();
        return;
      }
      emailInput.removeAttribute("aria-invalid");
      if (errEl) errEl.textContent = "";
      closeModal();
      goCheckout(checkoutPath, email);
    });
  }

  function applyModalCopy() {
    if (!modalEl) return;
    var badge = modalEl.querySelector(".fcd-lead-modal__badge");
    if (badge) badge.textContent = cfg.modalBadge;
    var title = modalEl.querySelector(".fcd-lead-modal__title");
    if (title) title.textContent = cfg.modalTitle;
    var sub = modalEl.querySelector(".fcd-lead-modal__sub");
    if (sub) sub.textContent = cfg.modalSub;
    if (emailInput) emailInput.placeholder = cfg.emailPlaceholder;
    var submit = modalEl.querySelector(".fcd-lead-modal__submit");
    if (submit) submit.textContent = cfg.modalSubmitLabel;
    var fine = modalEl.querySelector(".fcd-lead-modal__fine");
    if (fine) fine.textContent = cfg.modalFinePrint;
  }

  function bind(btn, path) {
    checkoutPath = path;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!cfg.captureEmail) {
        goCheckout(path, null);
        return;
      }
      ensureModal();
      applyModalCopy();
      openModal();
    });
  }

  function schedule(wrap, seconds) {
    if (seconds <= 0 || /(?:\?|&)fcd_cta_now=1(?:&|$)/.test(window.location.search)) {
      show(wrap);
      return;
    }
    window.setTimeout(function () {
      show(wrap);
    }, seconds * 1000);
  }

  function init() {
    var wrap = document.getElementById("fcd-vsl-cta");
    var btn = document.getElementById("fcd-vsl-cta-btn");
    if (!wrap || !btn) return;

    var cfgFile = "vsl-cta.json";
    var cur = document.currentScript;
    if (cur && cur.getAttribute("data-fcd-cta-json")) {
      cfgFile = cur.getAttribute("data-fcd-cta-json");
    }

    fetch(assetBase() + cfgFile, { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        Object.assign(cfg, j);
        if (cfg.ctaLabel) btn.textContent = cfg.ctaLabel;
        var sub = document.getElementById("fcd-vsl-cta-sub");
        if (sub && cfg.ctaSub) sub.textContent = cfg.ctaSub;
        bind(btn, cfg.goPath || "/go/main");
        schedule(wrap, Number(cfg.ctaDelaySeconds) || 0);
      })
      .catch(function () {
        bind(btn, cfg.goPath);
        schedule(wrap, cfg.ctaDelaySeconds);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
