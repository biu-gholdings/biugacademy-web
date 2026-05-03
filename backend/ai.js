"use strict";

const OpenAI = require("openai");

const LEARNER_TYPES = new Set([
  "Developer",
  "Founder",
  "Trader",
  "Operator",
  "Analyst",
  "Educator",
  "Civic Builder",
  "Beginner Talent",
  "Unknown",
]);

const SKILL_LEVELS = new Set(["Beginner", "Intermediate", "Advanced"]);

const PRIORITY_LEVELS = new Set(["Low", "Medium", "High", "Strategic"]);

function clampInt(n, min, max) {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((s) => String(s).trim()).filter(Boolean).slice(0, 50);
}

function normalizeProfile(raw) {
  const learner_type = LEARNER_TYPES.has(raw.learner_type)
    ? raw.learner_type
    : "Unknown";

  const skill_level = SKILL_LEVELS.has(raw.skill_level)
    ? raw.skill_level
    : "Intermediate";

  const priority_level = PRIORITY_LEVELS.has(raw.priority_level)
    ? raw.priority_level
    : "Medium";

  return {
    learner_type,
    skill_level,
    ai_readiness_score: clampInt(raw.ai_readiness_score, 0, 100),
    cubeshackles_fit_score: clampInt(raw.cubeshackles_fit_score, 0, 100),
    recommended_track: String(raw.recommended_track || "").trim() || "General",
    priority_level,
    strengths: asStringArray(raw.strengths),
    gaps: asStringArray(raw.gaps),
    recommended_next_steps: asStringArray(raw.recommended_next_steps),
    tags: asStringArray(raw.tags),
  };
}

const SYSTEM = `You are the BIU.G Academy AI intake layer (not a chatbot). Classify waitlist applicants for Angola-first technical education and the CubeShackles talent pipeline.

Return ONLY a single JSON object (no markdown, no prose) with exactly these keys and types:
- learner_type: string, one of: Developer, Founder, Trader, Operator, Analyst, Educator, Civic Builder, Beginner Talent, Unknown
- skill_level: string, one of: Beginner, Intermediate, Advanced
- ai_readiness_score: integer 0-100
- cubeshackles_fit_score: integer 0-100
- recommended_track: short string
- priority_level: string, one of: Low, Medium, High, Strategic
- strengths: array of short strings (3-8 items)
- gaps: array of short strings (2-6 items)
- recommended_next_steps: array of short strings (3-6 items)
- tags: array of short tags (5-12 items)

Use only the application payload. If data is thin, be conservative and use Unknown or Beginner Talent where appropriate.`;

/**
 * @param {Record<string, unknown>} application
 */
async function classifyApplicant(application) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Application JSON:\n${JSON.stringify(application, null, 2)}\n\nRespond with the JSON object only.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty OpenAI response");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("OpenAI returned non-JSON");
  }

  return normalizeProfile(parsed);
}

module.exports = { classifyApplicant };
