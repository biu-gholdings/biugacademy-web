/**
 * BIU.G Academy — navigation and waitlist form.
 *
 * Dual-mode submission:
 * 1. If WAITLIST_API_URL is set, POST JSON to backend AI intake endpoint.
 * 2. If WAITLIST_API_URL is empty, fall through to FormSubmit (normal form POST).
 *
 * Local backup is always stored in localStorage under biugAcademyApplications.
 * A frontend-only heuristic score is calculated for internal backup purposes.
 */

// TODO: Replace FormSubmit fallback with BIU.G Academy backend AI intake endpoint.
// Future backend responsibilities:
// 1. Save raw application to database.
// 2. Run AI classification.
// 3. Score applicant readiness.
// 4. Segment by province, interest, skill level, and CubeShackles ecosystem fit.
// 5. Store results for admin dashboard and cohort selection.

(function () {
  "use strict";

  var WAITLIST_API_URL = "";
  var WAITLIST_STORAGE_KEY = "biugAcademyApplications";

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

  function gatherPayload(form) {
    var fd = new FormData(form);
    var get = function (name) {
      return (fd.get(name) || "").toString().trim();
    };
    return {
      full_name: get("full_name"),
      email: get("email"),
      phone: get("phone"),
      country: get("country"),
      province: get("province"),
      city: get("city"),
      area_of_interest: get("area_of_interest"),
      commitment_level: get("commitment_level"),
      ai_experience_level: get("ai_experience_level"),
      cubeshackles_ecosystem_interest: get("cubeshackles_ecosystem_interest"),
      expertise: get("expertise"),
      problem_to_solve: get("problem_to_solve"),
      why_join: get("why_join"),
      consent: fd.get("consent") === "yes",
      whatsapp_optin: fd.get("whatsapp_optin") === "yes",
      certifications: get("certifications"),
      tools_used: get("tools_used"),
    };
  }

  function validatePayload(data) {
    var errors = [];
    if (!data.full_name) errors.push("full_name");
    if (!data.email || !validateEmail(data.email)) errors.push("email");
    if (!data.phone || !validatePhone(data.phone)) errors.push("phone");
    if (!data.country) errors.push("country");
    if (!data.province) errors.push("province");
    if (!data.city) errors.push("city");
    if (!data.area_of_interest) errors.push("area_of_interest");
    if (!data.commitment_level) errors.push("commitment_level");
    if (!data.ai_experience_level) errors.push("ai_experience_level");
    if (!data.cubeshackles_ecosystem_interest) errors.push("cubeshackles_ecosystem_interest");
    if (!data.expertise) errors.push("expertise");
    if (!data.problem_to_solve) errors.push("problem_to_solve");
    if (!data.why_join) errors.push("why_join");
    if (!data.consent) errors.push("consent");
    if (!data.whatsapp_optin) errors.push("whatsapp_optin");
    return errors;
  }

  function computeLocalScore(data) {
    var score = 0;
    if (data.province) score += 10;
    if (data.city) score += 10;
    if (data.why_join && data.why_join.length > 50) score += 15;
    if (data.problem_to_solve && data.problem_to_solve.length > 50) score += 15;
    var cl = (data.commitment_level || "").toLowerCase();
    if (cl.indexOf("tecnologia") !== -1 || cl.indexOf("ia") !== -1 || cl.indexOf("futuras") !== -1)
      score += 15;
    if (data.cubeshackles_ecosystem_interest === "Sim") score += 10;
    if (data.whatsapp_optin) score += 10;
    var ai = (data.ai_experience_level || "").toLowerCase();
    if (ai === "iniciante" || ai === "intermédio" || ai === "avançado") score += 10;
    if (score > 100) score = 100;

    var tier;
    if (score >= 70) tier = "high_signal";
    else if (score >= 40) tier = "medium_signal";
    else tier = "low_signal";

    var followup;
    if (tier === "high_signal") followup = "Priority review — strong alignment with first cohort.";
    else if (tier === "medium_signal")
      followup = "Standard review — additional context may improve candidacy.";
    else followup = "Needs more information — encourage resubmission with detail.";

    return { score: score, tier: tier, recommended_followup: followup };
  }

  function persistBackup(data) {
    var classification = computeLocalScore(data);
    var entry = {
      raw_application: data,
      local_classification_preview: classification,
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

  function initWaitlistForm() {
    var form = document.getElementById("waitlist-form");
    if (!form) return;

    var msg = document.getElementById("form-message");
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultLabel = submitBtn ? submitBtn.textContent : "";

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
          "Por favor preencha todos os campos obrigatórios com email e telefone válidos."
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

      if (WAITLIST_API_URL) {
        e.preventDefault();
        showFormMessage(msg, "success", "A enviar candidatura...");

        var payload = {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          country: data.country,
          province: data.province,
          city: data.city,
          area_of_interest: data.area_of_interest,
          current_role: data.commitment_level,
          expertise: data.expertise,
          certifications: data.certifications,
          ai_experience_level: data.ai_experience_level,
          preferred_learning_track: data.area_of_interest,
          cubeshackles_ecosystem_interest: data.cubeshackles_ecosystem_interest,
          tools_used: data.tools_used,
          problem_to_solve: data.problem_to_solve,
          why_join: data.why_join,
          consent: true,
        };

        fetch(WAITLIST_API_URL, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
            if (ref.res.ok && ref.body && ref.body.success) {
              window.location.href = "/thank-you/";
              return;
            }
            var detail =
              ref.body && ref.body.details && ref.body.details.length
                ? ref.body.details.join(" ")
                : ref.body && ref.body.error
                  ? ref.body.error
                  : "A submissão falhou. Tente novamente.";
            showFormMessage(msg, "error", detail);
            resetSubmitUi(form, submitBtn, defaultLabel);
          })
          .catch(function () {
            showFormMessage(
              msg,
              "error",
              "Não foi possível contactar o servidor. Verifique a sua ligação."
            );
            resetSubmitUi(form, submitBtn, defaultLabel);
          });
      }
      // If WAITLIST_API_URL is empty, allow normal FormSubmit POST (do not preventDefault)
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initWaitlistForm();
  });
})();
