/**
 * BIU.G Academy — navigation, intake submission and support widget.
 *
 * Intake strategy:
 * 1. For forms marked data-intake-form="waitlist", attempt the configured API.
 * 2. If the API is unavailable, misconfigured, or returns a non-success response,
 *    immediately fall back to the form's native action (FormSubmit email delivery).
 * 3. Forms without data-intake-form continue to submit natively.
 */

(function () {
  "use strict";

  var DEFAULT_WAITLIST_PATH = "/api/waitlist";
  var SUPPORT_EMAIL = "support@biugacademy.org";

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function detectActiveLanguage(pathname) {
    if (pathname === "/" || pathname === "") return "pt";
    if (pathname.indexOf("/pt") === 0) return "pt";
    if (pathname.indexOf("/en") === 0) return "en";
    if (pathname.indexOf("/fr") === 0) return "fr";
    return "pt";
  }

  function initLanguageSelector() {
    var selectors = document.querySelectorAll(".language-switcher, .lang-switcher");
    if (!selectors.length) return;
    var activeLang = detectActiveLanguage(window.location.pathname || "/");

    selectors.forEach(function (selector) {
      selector.querySelectorAll("a").forEach(function (link) {
        var lang = (link.getAttribute("data-lang") || "").toLowerCase();
        if (!lang) {
          var href = link.getAttribute("href") || "";
          if (href.indexOf("/en/") === 0) lang = "en";
          else if (href.indexOf("/fr/") === 0) lang = "fr";
          else if (href.indexOf("/pt/") === 0) lang = "pt";
        }
        link.classList.toggle("is-active", lang === activeLang);
      });
    });
  }

  function guessReferralSource() {
    var params = new URLSearchParams(window.location.search);
    return params.get("ref") || params.get("utm_source") || document.referrer || "direct";
  }

  function populateHiddenMetadata(form) {
    var browserLanguageInput = form.querySelector('input[name="browser_language"]');
    var timezoneInput = form.querySelector('input[name="timezone"]');
    var referralInput = form.querySelector('input[name="referral_source"]');
    var submittedAtInput = form.querySelector('input[name="submission_timestamp"]');

    if (browserLanguageInput) browserLanguageInput.value = navigator.language || "";
    if (timezoneInput && window.Intl && Intl.DateTimeFormat) {
      timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    }
    if (referralInput) referralInput.value = guessReferralSource();
    if (submittedAtInput) submittedAtInput.value = new Date().toISOString();
  }

  function formDataToObject(form) {
    var fd = new FormData(form);
    var payload = {};

    fd.forEach(function (value, key) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
        payload[key].push(value);
      } else {
        payload[key] = value;
      }
    });

    if (payload.consent_checkbox !== undefined) {
      payload.consent_checkbox = ["yes", "true", "on", true].indexOf(payload.consent_checkbox) !== -1;
    }
    payload.honeypot = payload.website || payload.honeypot || "";
    delete payload.website;
    return payload;
  }

  function resolveApiEndpoint(form) {
    var baseTag = document.querySelector('meta[name="biug-api-base"]');
    var base = form.getAttribute("data-api-base") || (baseTag ? baseTag.getAttribute("content") : "");
    base = (base || "").replace(/\/+$/, "");
    if (!base) return DEFAULT_WAITLIST_PATH;
    return base + DEFAULT_WAITLIST_PATH;
  }

  function ensureMessageBox(form) {
    var msg = document.getElementById("form-message");
    if (msg) return msg;
    msg = document.createElement("div");
    msg.id = "form-message";
    msg.className = "form-message";
    form.parentNode.insertBefore(msg, form);
    return msg;
  }

  function showFormMessage(el, type, text) {
    if (!el) return;
    el.textContent = text;
    el.className = "form-message is-visible " + (type || "");
  }

  function setSubmitState(form, busy) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (!button.getAttribute("data-default-label")) {
      button.setAttribute("data-default-label", button.textContent || "Submit");
    }
    button.disabled = !!busy;
    if (busy) {
      button.setAttribute("aria-busy", "true");
      button.textContent = "A enviar candidatura...";
    } else {
      button.removeAttribute("aria-busy");
      button.textContent = button.getAttribute("data-default-label") || "Submit";
    }
  }

  function nativeFallback(form) {
    form.setAttribute("data-native-fallback", "1");
    setSubmitState(form, false);
    HTMLFormElement.prototype.submit.call(form);
  }

  function initWaitlistForm(form) {
    if (!form) return;
    populateHiddenMetadata(form);

    form.addEventListener("submit", function (event) {
      if (form.getAttribute("data-native-fallback") === "1") return;
      if (!form.checkValidity()) return;
      if (form.getAttribute("data-submitting") === "1") {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      form.setAttribute("data-submitting", "1");
      populateHiddenMetadata(form);

      var msg = ensureMessageBox(form);
      var endpoint = resolveApiEndpoint(form);
      var payload = formDataToObject(form);
      setSubmitState(form, true);
      showFormMessage(msg, "success", "A enviar candidatura...");

      fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var body = {};
            try {
              body = JSON.parse(text);
            } catch (_ignore) {
              body = {};
            }
            return { res: res, body: body };
          });
        })
        .then(function (result) {
          if (result.res.ok && result.body && (result.body.ok || result.body.success)) {
            var next = form.querySelector('input[name="_next"]');
            window.location.href = next && next.value ? next.value : "/thank-you/";
            return;
          }

          // Static hosting commonly returns 404 for /api/waitlist. In that case,
          // or for any other backend failure, preserve the application by using
          // the native FormSubmit action configured on the form.
          if (form.action) {
            nativeFallback(form);
            return;
          }

          form.removeAttribute("data-submitting");
          setSubmitState(form, false);
          showFormMessage(msg, "error", "Não foi possível enviar a candidatura. Tente novamente.");
        })
        .catch(function () {
          if (form.action) {
            nativeFallback(form);
            return;
          }
          form.removeAttribute("data-submitting");
          setSubmitState(form, false);
          showFormMessage(msg, "error", "Não foi possível contactar o servidor. Tente novamente.");
        });
    });
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var targets = document.querySelectorAll("main .section, main .tile, .page-hero, .waitlist-wrap");
    if (!targets.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );

    targets.forEach(function (el) {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  function initSupportWidget() {
    if (document.getElementById("biug-support-launcher")) return;

    var style = document.createElement("style");
    style.textContent =
      ".biug-support-launcher{position:fixed;right:20px;bottom:20px;z-index:9998;border:0;border-radius:999px;padding:12px 18px;background:#111;color:#fff;font:600 14px 'DM Sans',sans-serif;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.24)}" +
      ".biug-support-panel{position:fixed;right:20px;bottom:76px;z-index:9999;width:min(360px,calc(100vw - 32px));background:#fff;color:#151515;border:1px solid #ddd;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.22);padding:18px;display:none;font-family:'DM Sans',sans-serif}" +
      ".biug-support-panel.is-open{display:block}.biug-support-panel h3{margin:0 0 6px;font-size:18px}.biug-support-panel p{margin:0 0 14px;font-size:13px;line-height:1.45;color:#555}" +
      ".biug-support-panel label{display:block;font-size:12px;font-weight:700;margin:10px 0 4px}.biug-support-panel input,.biug-support-panel textarea{box-sizing:border-box;width:100%;border:1px solid #ccc;border-radius:9px;padding:10px;font:14px 'DM Sans',sans-serif}.biug-support-panel textarea{min-height:92px;resize:vertical}" +
      ".biug-support-actions{display:flex;gap:8px;margin-top:12px}.biug-support-actions button{border:0;border-radius:9px;padding:10px 13px;cursor:pointer;font-weight:700}.biug-support-send{background:#111;color:#fff}.biug-support-close{background:#eee;color:#111}.biug-support-status{font-size:12px!important;margin-top:10px!important;color:#2d6a3f!important}";
    document.head.appendChild(style);

    var iframe = document.createElement("iframe");
    iframe.name = "biug-support-target";
    iframe.title = "Support submission target";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    var panel = document.createElement("aside");
    panel.className = "biug-support-panel";
    panel.id = "biug-support-panel";
    panel.setAttribute("aria-label", "BIU.G Academy support");
    panel.innerHTML =
      '<h3>BIU.G Academy Support</h3>' +
      '<p>Envie uma mensagem à nossa equipa. As respostas são tratadas por ' + SUPPORT_EMAIL + '.</p>' +
      '<form id="biug-support-form" action="https://formsubmit.co/' + SUPPORT_EMAIL + '" method="POST" target="biug-support-target">' +
      '<input type="hidden" name="_subject" value="BIU.G Academy — Website Support Request">' +
      '<input type="hidden" name="_template" value="table">' +
      '<input type="hidden" name="_captcha" value="false">' +
      '<input type="hidden" name="page_url" value="' + window.location.href.replace(/"/g, "&quot;") + '">' +
      '<label for="biug-support-name">Nome</label><input id="biug-support-name" name="name" required autocomplete="name">' +
      '<label for="biug-support-email">Email</label><input id="biug-support-email" name="email" type="email" required autocomplete="email">' +
      '<label for="biug-support-message">Mensagem</label><textarea id="biug-support-message" name="message" required></textarea>' +
      '<div class="biug-support-actions"><button class="biug-support-send" type="submit">Enviar</button><button class="biug-support-close" type="button">Fechar</button></div>' +
      '<p class="biug-support-status" id="biug-support-status" aria-live="polite"></p>' +
      '</form>';
    document.body.appendChild(panel);

    var launcher = document.createElement("button");
    launcher.id = "biug-support-launcher";
    launcher.className = "biug-support-launcher";
    launcher.type = "button";
    launcher.textContent = "Support";
    launcher.setAttribute("aria-controls", "biug-support-panel");
    launcher.setAttribute("aria-expanded", "false");
    document.body.appendChild(launcher);

    var close = panel.querySelector(".biug-support-close");
    var form = panel.querySelector("#biug-support-form");
    var status = panel.querySelector("#biug-support-status");

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
    }

    launcher.addEventListener("click", function () {
      setOpen(!panel.classList.contains("is-open"));
    });
    close.addEventListener("click", function () {
      setOpen(false);
    });
    form.addEventListener("submit", function () {
      status.textContent = "Mensagem enviada para a equipa de suporte.";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initLanguageSelector();
    initReveal();
    document.querySelectorAll("form[data-intake-form='waitlist']").forEach(function (form) {
      initWaitlistForm(form);
    });
    initSupportWidget();
  });
})();
