/**
 * BIU.G Academy — navigation and intake form.
 *
 * Primary mode: POST JSON to /api/waitlist (or configured API base).
 * Fallback mode: if API fails and the form has an action URL, submit natively.
 */

(function () {
  "use strict";

  var WAITLIST_STORAGE_KEY = "biugAcademyApplicationsV2";
  var DEFAULT_WAITLIST_PATH = "/api/waitlist";
  var PROVINCES = [
    "Bengo",
    "Benguela",
    "Bié",
    "Cabinda",
    "Cuando Cubango",
    "Cunene",
    "Huambo",
    "Huíla",
    "Luanda",
    "Lunda Norte",
    "Lunda Sul",
    "Malanje",
    "Moxico",
    "Namibe",
    "Uíge",
    "Zaire",
  ];

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

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function normalizePhone(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.indexOf("244") === 0) return "+" + digits;
    return "+244" + digits;
  }

  function validatePhone(value) {
    return String(value || "").replace(/\D/g, "").length >= 8;
  }

  function normalizeProvince(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    var lower = raw.toLowerCase();
    for (var i = 0; i < PROVINCES.length; i += 1) {
      if (PROVINCES[i].toLowerCase() === lower) return PROVINCES[i];
    }
    return raw;
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".form-group.is-invalid").forEach(function (g) {
      g.classList.remove("is-invalid");
    });
  }

  function setFieldError(form, dataField) {
    var group = form.querySelector('[data-field="' + dataField + '"]');
    if (group) group.classList.add("is-invalid");
  }

  function guessReferralSource() {
    var params = new URLSearchParams(window.location.search);
    return (
      params.get("ref") ||
      params.get("utm_source") ||
      document.referrer ||
      "direct"
    );
  }

  function gatherPayload(form) {
    var fd = new FormData(form);
    var get = function (name) {
      return (fd.get(name) || "").toString().trim();
    };
    var interestList = fd.getAll("areas_of_interest").map(function (v) {
      return String(v || "").trim();
    }).filter(Boolean);
    var phone = normalizePhone(get("phone_number"));
    var whatsapp = normalizePhone(get("whatsapp_number") || get("phone_number"));
    return {
      full_name: get("full_name"),
      email: get("email"),
      phone_number: phone,
      whatsapp_number: whatsapp,
      province: normalizeProvince(get("province")),
      municipality: get("municipality"),
      age_range: get("age_range"),
      primary_language: get("primary_language"),
      education_level: get("education_level"),
      areas_of_interest: interestList,
      technical_background: get("technical_background"),
      internet_access_level: get("internet_access_level"),
      device_access: get("device_access"),
      employment_status: get("employment_status"),
      linkedin_optional: get("linkedin_optional"),
      github_optional: get("github_optional"),
      motivation_statement: get("motivation_statement"),
      consent_checkbox: fd.get("consent_checkbox") === "yes",
      source_platform: get("source_platform") || "biugacademy-web",
      browser_language: get("browser_language") || (navigator.language || ""),
      timezone: get("timezone") || (
        Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone || "" : ""
      ),
      referral_source: get("referral_source") || guessReferralSource(),
      submission_timestamp: get("submission_timestamp") || new Date().toISOString(),
      honeypot: get("website"),
    };
  }

  function validatePayload(data) {
    var errors = [];
    if (!data.full_name || data.full_name.trim().length < 2) errors.push("full_name");
    if (!data.email || !validateEmail(data.email)) errors.push("email");
    if (!data.phone_number || !validatePhone(data.phone_number)) errors.push("phone_number");
    if (data.whatsapp_number && !validatePhone(data.whatsapp_number)) errors.push("whatsapp_number");
    if (!data.province) errors.push("province");
    if (!data.municipality) errors.push("municipality");
    if (!data.age_range) errors.push("age_range");
    if (!data.primary_language) errors.push("primary_language");
    if (!data.education_level) errors.push("education_level");
    if (!data.areas_of_interest || data.areas_of_interest.length === 0) errors.push("areas_of_interest");
    if (!data.technical_background) errors.push("technical_background");
    if (!data.internet_access_level) errors.push("internet_access_level");
    if (!data.device_access) errors.push("device_access");
    if (!data.employment_status) errors.push("employment_status");
    if (!data.motivation_statement || data.motivation_statement.trim().length < 20) {
      errors.push("motivation_statement");
    }
    if (!data.consent_checkbox) errors.push("consent_checkbox");
    if (data.honeypot) errors.push("honeypot");
    return errors;
  }

  function persistBackup(data) {
    var entry = {
      raw_application: data,
      submitted_at: new Date().toISOString(),
    };

    var list = [];
    try {
      var raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (raw) list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
    list.push(entry);
    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not write application backup to localStorage", e);
    }
  }

  function showFormMessage(el, type, text) {
    if (!el) return;
    el.textContent = text;
    el.className = "form-message is-visible " + (type || "");
  }

  function resetSubmitUi(form, submitBtn, defaultLabel) {
    form.removeAttribute("data-submitting");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.textContent = defaultLabel;
    }
  }

  function resolveApiEndpoint(form) {
    var baseTag = document.querySelector('meta[name="biug-api-base"]');
    var base = form.getAttribute("data-api-base") || (baseTag ? baseTag.getAttribute("content") : "");
    base = (base || "").replace(/\/+$/, "");
    if (!base) return DEFAULT_WAITLIST_PATH;
    return base + DEFAULT_WAITLIST_PATH;
  }

  function populateHiddenMetadata(form) {
    var browserLanguageInput = form.querySelector('input[name="browser_language"]');
    var timezoneInput = form.querySelector('input[name="timezone"]');
    var referralInput = form.querySelector('input[name="referral_source"]');
    var submittedAtInput = form.querySelector('input[name="submission_timestamp"]');
    if (browserLanguageInput) browserLanguageInput.value = navigator.language || "";
    if (timezoneInput && Intl && Intl.DateTimeFormat) {
      timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    }
    if (referralInput) referralInput.value = guessReferralSource();
    if (submittedAtInput) submittedAtInput.value = new Date().toISOString();
  }

  function initWaitlistForm(form) {
    if (!form) return;

    var msg = document.getElementById("form-message");
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultLabel = submitBtn ? submitBtn.textContent : "";
    var apiEndpoint = resolveApiEndpoint(form);

    populateHiddenMetadata(form);

    form.addEventListener("submit", function (e) {
      if (form.getAttribute("data-submitting") === "1") {
        e.preventDefault();
        return;
      }

      clearFieldErrors(form);
      if (msg) {
        msg.className = "form-message";
        msg.textContent = "";
      }

      var data = gatherPayload(form);
      var invalid = validatePayload(data);

      if (invalid.length) {
        e.preventDefault();
        invalid.forEach(function (name) {
          setFieldError(form, name);
        });
        showFormMessage(
          msg,
          "error",
          "Please fill in all required fields with valid contact details."
        );
        var firstInvalid = form.querySelector(".form-group.is-invalid");
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      persistBackup(data);

      form.setAttribute("data-submitting", "1");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
        submitBtn.textContent = "A enviar candidatura...";
      }

      e.preventDefault();
      showFormMessage(msg, "success", "Submitting your application...");

      fetch(apiEndpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var body = {};
            try {
              body = JSON.parse(text);
            } catch (ignore) {
              body = {};
            }
            return { res: res, body: body };
          });
        })
        .then(function (ref) {
          if (ref.res.ok && ref.body && ref.body.ok) {
            window.location.href = "/thank-you/";
            return;
          }
          var detail =
            ref.body && ref.body.details && ref.body.details.length
              ? ref.body.details.join(" ")
              : ref.body && ref.body.error
                ? ref.body.error
                : "Submission failed. Please try again.";
          showFormMessage(msg, "error", detail);
          resetSubmitUi(form, submitBtn, defaultLabel);
        })
        .catch(function () {
          // Graceful fallback keeps low-bandwidth submission path available.
          if (form.action) {
            form.submit();
            return;
          }
          showFormMessage(
            msg,
            "error",
            "Could not contact the intake server. Please try again."
          );
          resetSubmitUi(form, submitBtn, defaultLabel);
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    document.querySelectorAll("form[data-intake-form='waitlist']").forEach(function (form) {
      initWaitlistForm(form);
    });
  });
})();
