"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");

const { getPool, ensureSchema } = require("./db");
const { classifyApplicant } = require("./ai");
const { scoreApplicant } = require("./scoring");

const PORT = Number(process.env.PORT) || 3000;

const phoneDigitsOk = (s) => String(s).replace(/\D/g, "").length >= 8;
const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

const waitlistBodySchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .refine(phoneDigitsOk, "Phone must contain at least 8 digits"),
  country: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  area_of_interest: z.string().trim().min(1).max(200),
  current_role: z.string().trim().min(1).max(120),
  expertise: z.string().trim().min(1).max(4000),
  ai_experience_level: z.string().trim().min(1).max(200),
  preferred_learning_track: z.string().trim().min(1).max(200),
  cubeshackles_ecosystem_interest: z.string().trim().min(1).max(2000),
  problem_to_solve: z.string().trim().min(1).max(4000),
  why_join: z.string().trim().min(1).max(4000),
  certifications: z.preprocess(
    (v) => (v === undefined || v === null ? "" : v),
    z.string().trim().max(2000)
  ),
  tools_used: z.preprocess(
    (v) => (v === undefined || v === null ? "" : v),
    z.string().trim().max(2000)
  ),
  consent: z.preprocess(
    (v) => (v === true || v === "true" || v === "yes" ? true : v),
    z.boolean().refine((v) => v === true, { message: "consent must be true" })
  ),
});

function isSimplifiedPayload(body) {
  return body && body.contact && !body.email && !body.phone;
}

function normalizeSimplifiedPayload(body) {
  const contact = String(body.contact || "").trim();
  const email = looksLikeEmail(contact) ? contact : "unknown@pending.local";
  const phone = looksLikeEmail(contact) ? "00000000" : contact;

  return {
    full_name: body.full_name || body.name || "",
    email,
    phone,
    country: body.country || "Unknown",
    province: body.province || "Unknown",
    city: body.city || "Unknown",
    area_of_interest: body.interest || body.area_of_interest || "Unknown",
    current_role: body.current_role || "Not specified",
    expertise: body.expertise || "Not specified",
    ai_experience_level: body.ai_experience_level || "Nenhuma experiência",
    preferred_learning_track: body.preferred_learning_track || body.interest || "General",
    cubeshackles_ecosystem_interest: body.cubeshackles_ecosystem_interest || "Talvez",
    problem_to_solve: body.problem_to_solve || body.motivation || "Not specified",
    why_join: body.why_join || body.motivation || "Not specified",
    certifications: body.certifications || "",
    tools_used: body.tools_used || "",
    consent: true,
  };
}

function buildAllowedOrigins() {
  const raw = (process.env.FRONTEND_ORIGIN || "").trim().replace(/\/+$/, "");
  const set = new Set();
  if (raw) {
    set.add(raw);
    if (raw.startsWith("https://") && !raw.includes("www.")) {
      set.add(raw.replace("https://", "https://www."));
    }
  }
  if (process.env.NODE_ENV !== "production") {
    [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ].forEach((o) => set.add(o));
  }
  return set;
}

const allowedOrigins = buildAllowedOrigins();

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

app.use(express.json({ limit: "256kb" }));

const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many submissions. Try again later." },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "biug-academy-backend" });
});

app.post("/api/waitlist", waitlistLimiter, async (req, res) => {
  const input = isSimplifiedPayload(req.body) ? normalizeSimplifiedPayload(req.body) : req.body;

  const parsed = waitlistBodySchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => `${e.path.join(".") || "body"}: ${e.message}`);
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details,
    });
  }

  const b = parsed.data;

  const row = {
    full_name: b.full_name.trim(),
    email: b.email.trim().toLowerCase(),
    phone: b.phone.trim(),
    country: b.country.trim(),
    province: b.province.trim(),
    city: b.city.trim(),
    area_of_interest: b.area_of_interest.trim(),
    current_role: b.current_role.trim(),
    expertise: b.expertise.trim(),
    ai_experience_level: b.ai_experience_level.trim(),
    preferred_learning_track: b.preferred_learning_track.trim(),
    cubeshackles_ecosystem_interest: b.cubeshackles_ecosystem_interest.trim(),
    problem_to_solve: b.problem_to_solve.trim(),
    why_join: b.why_join.trim(),
    consent: true,
    certifications: b.certifications,
    tools_used: b.tools_used,
  };

  const pool = getPool();
  let applicationId;

  try {
    const insertApp = await pool.query(
      `INSERT INTO waitlist_applications (
        full_name, email, phone, country, province, city,
        area_of_interest, "current_role", expertise,
        ai_experience_level, preferred_learning_track, cubeshackles_ecosystem_interest,
        problem_to_solve, why_join, consent, certifications, tools_used
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
        row.ai_experience_level,
        row.preferred_learning_track,
        row.cubeshackles_ecosystem_interest,
        row.problem_to_solve,
        row.why_join,
        row.consent,
        row.certifications,
        row.tools_used,
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
  let aiProvider = "deterministic";
  let aiError = null;

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  const openaiAvailable = apiKey && !apiKey.startsWith("sk-placeholder");

  if (openaiAvailable) {
    try {
      profile = await classifyApplicant(row);
      aiProvider = "openai";
    } catch (e) {
      console.error(
        "OpenAI classification failed, falling back to deterministic scoring:",
        e.message
      );
      aiError = e.message;
    }
  }

  if (!profile) {
    const local = scoreApplicant(row);
    profile = {
      learner_type: "Unknown",
      skill_level: "Beginner",
      ai_readiness_score: local.score * 5,
      cubeshackles_fit_score: local.score * 5,
      recommended_track: local.track,
      priority_level:
        local.priority === "high" ? "High" : local.priority === "mid" ? "Medium" : "Low",
      strengths: local.tags,
      gaps: [],
      recommended_next_steps: [],
      tags: local.tags,
    };
    aiProvider = "deterministic";
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
  }

  const local = scoreApplicant(row);

  return res.status(201).json({
    ok: true,
    applicant_id: applicationId,
    score: local.score,
    track: local.track,
    priority: local.priority,
    ai_provider: aiProvider,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

async function start() {
  try {
    getPool();
    await ensureSchema();
  } catch (e) {
    console.error("Database init failed:", e.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`BIU.G Academy backend listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
