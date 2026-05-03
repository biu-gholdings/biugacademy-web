import express from "express";
import rateLimit from "express-rate-limit";
import { getPool } from "./db.js";
import { classifyApplicant } from "./openaiAnalyze.js";

const router = express.Router();

const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many submissions. Try again later." },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUIRED_STRINGS = [
  "full_name",
  "email",
  "phone",
  "country",
  "province",
  "city",
  "area_of_interest",
  "current_role",
  "expertise",
  "ai_experience_level",
  "preferred_learning_track",
  "cubeshackles_ecosystem_interest",
  "tools_used",
  "problem_to_solve",
  "why_join",
];

function trimStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function validateBody(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Invalid JSON body"] };
  }

  for (const key of REQUIRED_STRINGS) {
    const t = trimStr(body[key]);
    if (!t) errors.push(`Missing or empty: ${key}`);
  }

  const certifications = trimStr(body.certifications);
  if (!certifications) {
    errors.push("Missing: certifications (enter N/A if none)");
  }

  if (body.consent !== true && body.consent !== "true" && body.consent !== "yes") {
    errors.push("consent must be true");
  }

  const email = trimStr(body.email);
  if (email && !EMAIL_RE.test(email)) {
    errors.push("Invalid email format");
  }

  const phone = trimStr(body.phone);
  const digits = phone.replace(/\D/g, "");
  if (phone && digits.length < 8) {
    errors.push("Phone must contain at least 8 digits");
  }

  return { ok: errors.length === 0, errors };
}

router.post("/waitlist", waitlistLimiter, async (req, res) => {
  const body = req.body;
  const { ok, errors } = validateBody(body);
  if (!ok) {
    return res.status(400).json({ success: false, error: "Validation failed", details: errors });
  }

  const row = {
    full_name: trimStr(body.full_name),
    email: trimStr(body.email).toLowerCase(),
    phone: trimStr(body.phone),
    country: trimStr(body.country),
    province: trimStr(body.province),
    city: trimStr(body.city),
    area_of_interest: trimStr(body.area_of_interest),
    current_role: trimStr(body.current_role),
    expertise: trimStr(body.expertise),
    certifications: trimStr(body.certifications),
    ai_experience_level: trimStr(body.ai_experience_level),
    preferred_learning_track: trimStr(body.preferred_learning_track),
    cubeshackles_ecosystem_interest: trimStr(body.cubeshackles_ecosystem_interest),
    tools_used: trimStr(body.tools_used),
    problem_to_solve: trimStr(body.problem_to_solve),
    why_join: trimStr(body.why_join),
    consent: true,
  };

  const applicationForAi = { ...row };
  delete applicationForAi.consent;

  const pool = getPool();
  let applicationId;

  try {
    const insertApp = await pool.query(
      `INSERT INTO waitlist_applications (
        full_name, email, phone, country, province, city,
        area_of_interest, current_role, expertise, certifications,
        ai_experience_level, preferred_learning_track, cubeshackles_ecosystem_interest,
        tools_used, problem_to_solve, why_join, consent
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      ) RETURNING id`,
      [
        row.full_name,
        row.email,
        row.phone,
        row.country,
        row.province,
        row.city,
        row.area_of_interest,
        row.current_role,
        row.expertise,
        row.certifications,
        row.ai_experience_level,
        row.preferred_learning_track,
        row.cubeshackles_ecosystem_interest,
        row.tools_used,
        row.problem_to_solve,
        row.why_join,
        row.consent,
      ]
    );
    applicationId = insertApp.rows[0].id;
  } catch (e) {
    console.error("DB insert application failed", e);
    return res.status(500).json({
      success: false,
      error: "Could not save application.",
    });
  }

  let profile;
  try {
    profile = await classifyApplicant(applicationForAi);
  } catch (e) {
    console.error("OpenAI classification failed", e);
    try {
      await pool.query(`DELETE FROM waitlist_applications WHERE id = $1`, [applicationId]);
    } catch (delErr) {
      console.error("Rollback delete failed", delErr);
    }
    return res.status(502).json({
      success: false,
      error: "Application could not be analyzed. Please try again shortly.",
    });
  }

  try {
    await pool.query(
      `INSERT INTO waitlist_ai_profiles (
        application_id, learner_type, skill_level, ai_readiness_score, cubeshackles_fit_score,
        recommended_track, priority_level, strengths, gaps, recommended_next_steps, tags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb)`,
      [
        applicationId,
        profile.learner_type,
        profile.skill_level,
        profile.ai_readiness_score,
        profile.cubeshackles_fit_score,
        profile.recommended_track,
        profile.priority_level,
        JSON.stringify(profile.strengths),
        JSON.stringify(profile.gaps),
        JSON.stringify(profile.recommended_next_steps),
        JSON.stringify(profile.tags),
      ]
    );
  } catch (e) {
    console.error("DB insert AI profile failed", e);
    try {
      await pool.query(`DELETE FROM waitlist_applications WHERE id = $1`, [applicationId]);
    } catch (delErr) {
      console.error("Rollback delete failed", delErr);
    }
    return res.status(500).json({
      success: false,
      error: "Could not store analysis result.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Application received and analyzed.",
    application_id: applicationId,
    ai_profile: profile,
  });
});

export default router;
