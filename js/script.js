/**
 * BIU.G Academy — navigation and waitlist form (Formspree + localStorage backup).
 *
 * Waitlist form POSTs to Formspree. Validation and localStorage backup run in JS;
 * if validation passes, the native form submit proceeds (no mailto).
 *
 * TODO: Create a Formspree form connected to support@biugacademy.org and replace
 * REPLACE_WITH_FORM_ID in contact/index.html with the real Formspree ID.
 */
(function () {
  "use strict";

  var WAITLIST_STORAGE_KEY = "biugAcademyWaitlistSubmissions";

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

  function clearFieldErrors(form) {
    form.querySelectorAll(".form-group.is-invalid").forEach(function (g) {
      g.classList.remove("is-invalid");
    });
  }

  function setFieldError(form, name) {
    var group = form.querySelector('[data-field="' + name + '"]');
    if (group) group.classList.add("is-invalid");
  }

  function gatherWaitlistPayload(form) {
    var fd = new FormData(form);
    return {
      fullName: (fd.get("fullName") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      phone: (fd.get("phone") || "").toString().trim(),
      country: (fd.get("country") || "").toString().trim(),
      province: (fd.get("province") || "").toString().trim(),
      city: (fd.get("city") || "").toString().trim(),
      areaOfInterest: (fd.get("areaOfInterest") || "").toString().trim(),
      areasOfExpertise: (fd.get("areasOfExpertise") || "").toString().trim(),
      recentCerts: (fd.get("recentCerts") || "").toString().trim(),
      currentRole: (fd.get("currentRole") || "").toString().trim(),
      whyJoin: (fd.get("whyJoin") || "").toString().trim(),
      consent: fd.get("consent") === "yes",
    };
  }

  function validateWaitlist(data) {
    var errors = [];
    if (!data.fullName) errors.push("fullName");
    if (!data.email || !validateEmail(data.email)) errors.push("email");
    if (!data.phone) errors.push("phone");
    if (!data.country) errors.push("country");
    if (!data.province) errors.push("province");
    if (!data.city) errors.push("city");
    if (!data.areaOfInterest) errors.push("areaOfInterest");
    if (!data.consent) errors.push("consent");
    return errors;
  }

  function persistWaitlistBackup(data) {
    var list = [];
    try {
      var raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (raw) list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
    list.push(
      Object.assign({}, data, {
        submittedAt: new Date().toISOString(),
      })
    );
    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not write waitlist backup to localStorage", e);
    }
  }

  function showFormMessage(el, type, text) {
    if (!el) return;
    el.textContent = text;
    el.className = "form-message is-visible " + (type || "");
  }

  function initWaitlistForm() {
    var form = document.getElementById("waitlist-form");
    if (!form) return;

    var msg = document.getElementById("form-message");

    form.addEventListener("submit", function (e) {
      clearFieldErrors(form);
      if (msg) {
        msg.className = "form-message";
        msg.textContent = "";
      }

      var data = gatherWaitlistPayload(form);
      var invalid = validateWaitlist(data);

      if (invalid.length) {
        e.preventDefault();
        invalid.forEach(function (name) {
          setFieldError(form, name);
        });
        showFormMessage(
          msg,
          "error",
          "Please complete all required fields before submitting."
        );
        return;
      }

      persistWaitlistBackup(data);
      showFormMessage(msg, "success", "Submitting your application…");
      /* Do not call e.preventDefault(); Formspree receives the POST next. */
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initWaitlistForm();
  });
})();
