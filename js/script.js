/**
 * BIU.G Academy — navigation, first-cohort intake and support.
 *
 * Production data path:
 * browser -> BIU.G Academy API -> PostgreSQL + transactional email outbox.
 * No applicant or support payload is sent through a third-party form relay.
 */

(function () {
  "use strict";

  var DEFAULT_API_BASE = "";
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

  function resolveApiBase(form) {
    var baseTag = document.querySelector('meta[name="biug-api-base"]');
    var fromWindow = window.BIUG_API_BASE || "";
    var base =
      (form && form.getAttribute("data-api-base")) ||
      (baseTag ? baseTag.getAttribute("content") : "") ||
      fromWindow ||
      DEFAULT_API_BASE;
    return String(base || "").replace(/\/+$/, "");
  }

  function apiEndpoint(form, path) {
    return resolveApiBase(form) + path;
  }

  /**
   * The API is only reachable when an explicit origin is configured, or when the
   * page is served by a host that also serves /api/*. GitHub Pages and other
   * static hosts answer /api/* with an HTML 404 or a 405, which is indistinguishable
   * from a real outage once fetch() has run. Refuse to submit in that case rather
   * than reporting a connection error and discarding what the applicant typed.
   */
  function apiIsConfigured(form) {
    if (resolveApiBase(form)) return true;
    return document.documentElement.hasAttribute("data-biug-api-same-origin");
  }

  var RECOVERY_KEY = "biug:unsent-submissions";

  function preserveSubmission(kind, payload) {
    try {
      var raw = window.localStorage.getItem(RECOVERY_KEY);
      var queue = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(queue)) queue = [];
      queue.push({ kind: kind, payload: payload, saved_at: new Date().toISOString() });
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(queue.slice(-20)));
      return true;
    } catch (error) {
      // Private browsing or disabled storage - the mailto route below still applies.
      return false;
    }
  }

  function mailtoFallback(subject, payload) {
    var lines = Object.keys(payload)
      .filter(function (key) {
        return key.charAt(0) !== "_" && String(payload[key] || "").trim() !== "";
      })
      .map(function (key) {
        return key + ": " + payload[key];
      });
    return (
      "mailto:" +
      SUPPORT_EMAIL +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(lines.join("\n"))
    );
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
      if (key.charAt(0) === "_") return;
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
        payload[key].push(value);
      } else {
        payload[key] = value;
      }
    });
    if (payload.consent_checkbox !== undefined) {
      payload.consent_checkbox =
        ["yes", "true", "on", true].indexOf(payload.consent_checkbox) !== -1;
    }
    payload.honeypot = payload.website || payload.honeypot || "";
    delete payload.website;
    return payload;
  }

  function ensureMessageBox(form) {
    var msg = form.parentNode.querySelector(".form-message");
    if (msg) return msg;
    msg = document.createElement("div");
    msg.className = "form-message";
    msg.setAttribute("aria-live", "polite");
    form.parentNode.insertBefore(msg, form);
    return msg;
  }

  function showFormMessage(el, type, text) {
    if (!el) return;
    el.textContent = text;
    el.className = "form-message is-visible " + (type || "");
  }

  /**
   * Same as showFormMessage, with a trailing link. The link is built as a DOM node
   * rather than via innerHTML because the href embeds applicant-supplied values.
   */
  function showFormMessageWithLink(el, type, text, href, linkText) {
    if (!el) return;
    el.textContent = text + " ";
    var link = document.createElement("a");
    link.href = href;
    link.textContent = linkText;
    el.appendChild(link);
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

  function parseJsonResponse(res) {
    return res.text().then(function (text) {
      var body = {};
      try {
        body = JSON.parse(text);
      } catch (_ignore) {
        body = {};
      }
      return { res: res, body: body };
    });
  }

  function initWaitlistForm(form) {
    if (!form) return;
    populateHiddenMetadata(form);
    form.removeAttribute("action");
    form.setAttribute("method", "POST");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (form.getAttribute("data-submitting") === "1") return;

      populateHiddenMetadata(form);
      var msg = ensureMessageBox(form);
      var payload = formDataToObject(form);

      if (!apiIsConfigured(form)) {
        var saved = preserveSubmission("application", payload);
        console.error(
          "BIU.G Academy: no application API configured for this origin; submission was not sent."
        );
        showFormMessageWithLink(
          msg,
          "error",
          "O sistema de candidaturas ainda não está disponível nesta página. " +
            (saved ? "As suas respostas foram guardadas neste navegador. " : "") +
            "Envie a sua candidatura para",
          mailtoFallback("Candidatura BIU.G Academy", payload),
          SUPPORT_EMAIL
        );
        return;
      }

      form.setAttribute("data-submitting", "1");
      setSubmitState(form, true);
      showFormMessage(msg, "success", "A enviar candidatura...");

      fetch(apiEndpoint(form, "/api/waitlist"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(parseJsonResponse)
        .then(function (result) {
          if (result.res.ok && result.body && result.body.ok) {
            var next = form.querySelector('input[name="_next"]');
            window.location.href = next && next.value ? next.value : "/thank-you/";
            return;
          }
          var detail = result.body && (result.body.error || result.body.message);
          throw new Error(detail || "Submission failed");
        })
        .catch(function (error) {
          form.removeAttribute("data-submitting");
          setSubmitState(form, false);
          console.error("BIU.G Academy application submission failed", error);
          var kept = preserveSubmission("application", payload);
          showFormMessageWithLink(
            msg,
            "error",
            "Não foi possível enviar a candidatura. " +
              (kept ? "As suas respostas foram guardadas neste navegador. " : "") +
              "Tente novamente ou escreva para",
            mailtoFallback("Candidatura BIU.G Academy", payload),
            SUPPORT_EMAIL
          );
        });
    });
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var targets = document.querySelectorAll(
      "main .section, main .tile, .page-hero, .waitlist-wrap"
    );
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
      ".biug-support-actions{display:flex;gap:8px;margin-top:12px}.biug-support-actions button{border:0;border-radius:9px;padding:10px 13px;cursor:pointer;font-weight:700}.biug-support-send{background:#111;color:#fff}.biug-support-close{background:#eee;color:#111}.biug-support-status{font-size:12px!important;margin-top:10px!important}";
    document.head.appendChild(style);

    var panel = document.createElement("aside");
    panel.className = "biug-support-panel";
    panel.id = "biug-support-panel";
    panel.setAttribute("aria-label", "BIU.G Academy support");
    panel.innerHTML =
      "<h3>BIU.G Academy Support</h3>" +
      "<p>Envie uma mensagem à nossa equipa em " +
      SUPPORT_EMAIL +
      ".</p>" +
      '<form id="biug-support-form">' +
      '<label for="biug-support-name">Nome</label><input id="biug-support-name" name="name" required autocomplete="name">' +
      '<label for="biug-support-email">Email</label><input id="biug-support-email" name="email" type="email" required autocomplete="email">' +
      '<label for="biug-support-message">Mensagem</label><textarea id="biug-support-message" name="message" required></textarea>' +
      '<div class="biug-support-actions"><button class="biug-support-send" type="submit">Enviar</button><button class="biug-support-close" type="button">Fechar</button></div>' +
      '<p class="biug-support-status" id="biug-support-status" aria-live="polite"></p>' +
      "</form>";
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
    var send = panel.querySelector(".biug-support-send");

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

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var supportPayload = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim(),
        page_url: window.location.href,
      };

      if (!apiIsConfigured(null)) {
        preserveSubmission("support", supportPayload);
        console.error(
          "BIU.G Academy: no support API configured for this origin; message was not sent."
        );
        status.textContent = "Escreva-nos directamente para " + SUPPORT_EMAIL + ".";
        window.location.href = mailtoFallback("Suporte BIU.G Academy", supportPayload);
        return;
      }

      send.disabled = true;
      status.textContent = "A enviar...";
      fetch(apiEndpoint(null, "/api/support"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(supportPayload),
      })
        .then(parseJsonResponse)
        .then(function (result) {
          if (!result.res.ok || !result.body || !result.body.ok)
            throw new Error("Support submission failed");
          form.reset();
          status.textContent = "Mensagem recebida. A equipa de suporte foi notificada.";
        })
        .catch(function (error) {
          console.error("BIU.G Academy support submission failed", error);
          preserveSubmission("support", supportPayload);
          status.textContent =
            "Não foi possível enviar. Tente novamente ou escreva para " + SUPPORT_EMAIL + ".";
        })
        .finally(function () {
          send.disabled = false;
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initLanguageSelector();
    initReveal();
    document.querySelectorAll("form[data-intake-form='waitlist']").forEach(initWaitlistForm);
    initSupportWidget();
  });
})();
