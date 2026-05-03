/**
 * BIU.G Academy — navigation and waitlist form (JSON POST to backend AI intake).
 *
 * API base: <meta name="biug-api-base" content="http://localhost:3000"> or empty for same-origin /api/waitlist.
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

  function getWaitlistApiUrl() {
    var m = document.querySelector('meta[name="biug-api-base"]');
    var base = m && m.getAttribute("content") ? m.getAttribute("content").trim() : "";
    if (base) {
      return base.replace(/\/+$/, "") + "/api/waitlist";
    }
    return "/api/waitlist";
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function validatePhone(value) {
    var d = String(value).replace(/\D/g, "");
    return d.length >= 8;
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

  function gatherWaitlistPayload(form) {
    var fd = new FormData(form);
    return {
      full_name: (fd.get("full_name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      phone: (fd.get("phone") || "").toString().trim(),
      country: (fd.get("country") || "").toString().trim(),
      province: (fd.get("province") || "").toString().trim(),
      city: (fd.get("city") || "").toString().trim(),
      area_of_interest: (fd.get("area_of_interest") || "").toString().trim(),
      current_role: (fd.get("current_role") || "").toString().trim(),
      expertise: (fd.get("expertise") || "").toString().trim(),
      certifications: (fd.get("certifications") || "").toString().trim(),
      ai_experience_level: (fd.get("ai_experience_level") || "").toString().trim(),
      preferred_learning_track: (fd.get("preferred_learning_track") || "").toString().trim(),
      cubeshackles_ecosystem_interest: (fd.get("cubeshackles_ecosystem_interest") || "")
        .toString()
        .trim(),
      tools_used: (fd.get("tools_used") || "").toString().trim(),
      problem_to_solve: (fd.get("problem_to_solve") || "").toString().trim(),
      why_join: (fd.get("why_join") || "").toString().trim(),
      consent: fd.get("consent") === "yes",
    };
  }

  function validateWaitlistExtras(data) {
    var errors = [];
    if (!data.full_name) errors.push("full_name");
    if (!data.email || !validateEmail(data.email)) errors.push("email");
    if (!data.phone || !validatePhone(data.phone)) errors.push("phone");
    if (!data.country) errors.push("country");
    if (!data.province) errors.push("province");
    if (!data.city) errors.push("city");
    if (!data.area_of_interest) errors.push("area_of_interest");
    if (!data.current_role) errors.push("current_role");
    if (!data.expertise) errors.push("expertise");
    if (!data.certifications) errors.push("certifications");
    if (!data.ai_experience_level) errors.push("ai_experience_level");
    if (!data.preferred_learning_track) errors.push("preferred_learning_track");
    if (!data.cubeshackles_ecosystem_interest) errors.push("cubeshackles_ecosystem_interest");
    if (!data.tools_used) errors.push("tools_used");
    if (!data.problem_to_solve) errors.push("problem_to_solve");
    if (!data.why_join) errors.push("why_join");
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

  function resetSubmitUi(form, submitBtn, defaultBtnLabel) {
    form.removeAttribute("data-waitlist-submitting");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.textContent = defaultBtnLabel;
    }
  }

  function initWaitlistForm() {
    var form = document.getElementById("waitlist-form");
    if (!form) return;

    var msg = document.getElementById("form-message");
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultBtnLabel = submitBtn ? submitBtn.textContent : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (form.getAttribute("data-waitlist-submitting") === "1") {
        return;
      }

      clearFieldErrors(form);
      if (msg) {
        msg.className = "form-message";
        msg.textContent = "";
      }

      if (typeof form.reportValidity === "function" && !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = gatherWaitlistPayload(form);
      var invalid = validateWaitlistExtras(data);

      if (invalid.length) {
        invalid.forEach(function (name) {
          setFieldError(form, name);
        });
        showFormMessage(
          msg,
          "error",
          "Please complete all required fields with valid email and phone before submitting."
        );
        return;
      }

      var payload = Object.assign({}, data, { consent: true });

      form.setAttribute("data-waitlist-submitting", "1");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
        submitBtn.textContent = "Submitting…";
      }
      showFormMessage(msg, "success", "Submitting your application…");

      var url = getWaitlistApiUrl();

      fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var body = {};
            if (text) {
              try {
                body = JSON.parse(text);
              } catch (ignore) {
                body = {};
              }
            }
            return { res: res, body: body };
          });
        })
        .then(function (_ref) {
          var res = _ref.res;
          var body = _ref.body;
          if (res.ok && body && body.success) {
            try {
              persistWaitlistBackup(
                Object.assign({}, data, {
                  application_id: body.application_id,
                  ai_profile: body.ai_profile,
                })
              );
            } catch (err) {
              console.warn(err);
            }
            window.location.assign("/thank-you/");
            return;
          }
          var detail =
            body && body.details && body.details.length
              ? body.details.join(" ")
              : body && body.error
                ? body.error
                : "Submission failed. Please try again.";
          showFormMessage(msg, "error", detail);
          resetSubmitUi(form, submitBtn, defaultBtnLabel);
        })
        .catch(function () {
          showFormMessage(
            msg,
            "error",
            "Could not reach the server. Check your connection and API base URL (meta biug-api-base)."
          );
          resetSubmitUi(form, submitBtn, defaultBtnLabel);
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initWaitlistForm();
  });
})();
