/**
 * BIU.G Academy — shared UI and waitlist handling (static hosting).
 *
 * TODO: Replace localStorage/mailto with API endpoint or form backend.
 */

(function () {
  "use strict";

  var STORAGE_KEY = "biug_academy_waitlist_v1";
  var MAILTO = "support@biu-gholdings.org";

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

  function gatherFormData(form) {
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
      consent: fd.get("consent") === "on",
    };
  }

  function validateWaitlist(data) {
    var errors = [];
    if (!data.fullName) errors.push("fullName");
    if (!data.email || !validateEmail(data.email)) errors.push("email");
    if (!data.consent) errors.push("consent");
    return errors;
  }

  function formatBody(data) {
    var lines = [
      "BIU.G Academy — waitlist submission",
      "",
      "Full Name: " + data.fullName,
      "Email: " + data.email,
      "Phone / WhatsApp: " + data.phone,
      "Country: " + data.country,
      "Province: " + data.province,
      "City: " + data.city,
      "Area of Interest: " + data.areaOfInterest,
      "",
      "Areas of Expertise:",
      data.areasOfExpertise || "(none provided)",
      "",
      "Recent accreditations or certificates:",
      data.recentCerts || "(none provided)",
      "",
      "Current role:",
      data.currentRole || "(none provided)",
      "",
      "Why join BIU.G Academy?",
      data.whyJoin || "(none provided)",
      "",
      "Consent: " + (data.consent ? "Yes" : "No"),
    ];
    return lines.join("\n");
  }

  function persistSubmission(data) {
    var list = [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not write waitlist to localStorage", e);
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
      e.preventDefault();
      clearFieldErrors(form);
      if (msg) {
        msg.className = "form-message";
        msg.textContent = "";
      }

      var data = gatherFormData(form);
      var invalid = validateWaitlist(data);

      if (invalid.length) {
        invalid.forEach(function (name) {
          setFieldError(form, name);
        });
        showFormMessage(msg, "error", "Please correct the highlighted fields.");
        return;
      }

      persistSubmission(data);

      var subject = encodeURIComponent("BIU.G Academy — waitlist");
      var body = encodeURIComponent(formatBody(data));
      var href = "mailto:" + MAILTO + "?subject=" + subject + "&body=" + body;

      showFormMessage(
        msg,
        "success",
        "Your details were saved locally for testing. Opening your email client with a draft to " +
          MAILTO +
          "…"
      );

      window.setTimeout(function () {
        window.location.href = href;
      }, 600);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initWaitlistForm();
  });
})();
