"use strict";

const ANGOLA_HINTS = [
  "aoa", "kz", "luanda", "benguela", "huila", "huambo", "cabinda",
  "malanje", "namibe", "uige", "bengo", "bié", "bie",
  "lunda norte", "lunda sul", "moxico", "zaire", "cunene",
  "kwanza norte", "kwanza sul", "cuando cubango", "angola",
];

const ACTION_WORDS = ["build", "start", "learn", "earn", "improve", "grow"];

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

function containsAny(text, words) {
  return words.some((w) => text.includes(w));
}

function inferTrack(interest) {
  const i = norm(interest);
  if (i.includes("money") || i.includes("financ")) return "money";
  if (i.includes("business") || i.includes("negócio")) return "business";
  if (i.includes("technical") || i.includes("software") || i.includes("tecnologia")) return "technical";
  return "digital";
}

function priorityFromScore(score) {
  if (score >= 15) return "high";
  if (score >= 10) return "mid";
  return "low";
}

function scoreApplicant(application) {
  const interest = norm(application.area_of_interest || application.interest || "");
  const motivation = norm(application.why_join || application.motivation || "");
  const province = norm(application.province || "");
  const country = norm(application.country || "");
  const problem = norm(application.problem_to_solve || "");

  const combined = [
    norm(application.full_name || application.name || ""),
    norm(application.email || application.contact || ""),
    interest, motivation, province, country, problem,
  ].join(" ");

  const tags = [];
  let score = 0;

  if (motivation.length > 60) {
    score += 5;
    tags.push("long_motivation");
  }

  if (containsAny(combined, ANGOLA_HINTS)) {
    score += 5;
    tags.push("angola_context");
  }

  if (interest.includes("money") || interest.includes("business") ||
      interest.includes("financ") || interest.includes("negócio")) {
    score += 5;
    tags.push("commercial_interest");
  }

  if (containsAny(combined, ACTION_WORDS)) {
    score += 5;
    tags.push("action_words_present");
  }

  const track = inferTrack(interest);
  const priority = priorityFromScore(score);

  return { score, track, priority, tags };
}

module.exports = { scoreApplicant };
