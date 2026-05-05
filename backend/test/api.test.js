"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://biug:biug_dev_pass@127.0.0.1:5432/biug_academy";

delete process.env.OPENAI_API_KEY;

const { app } = require("../server");

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: server.address().port,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let server;

before(async () => {
  const { getPool, ensureSchema } = require("../db");
  getPool();
  await ensureSchema();
  server = app.listen(0);
  await new Promise((resolve) => server.on("listening", resolve));
});

after(async () => {
  if (server) server.close();
  const { getPool } = require("../db");
  try {
    await getPool().end();
  } catch { /* ignore */ }
});

describe("GET /api/health", () => {
  it("returns ok: true", async () => {
    const res = await request("GET", "/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.service, "biug-academy-backend");
  });
});

describe("POST /api/waitlist", () => {
  it("returns 400 on empty body", async () => {
    const res = await request("POST", "/api/waitlist", {});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it("returns 201 with deterministic scoring when OPENAI_API_KEY is missing", async () => {
    const payload = {
      full_name: "Test Applicant",
      email: "test-" + Date.now() + "@example.com",
      phone: "+244923456789",
      country: "Angola",
      province: "Luanda",
      city: "Luanda",
      area_of_interest: "Technology / Software",
      current_role: "Developer",
      expertise: "JavaScript, PostgreSQL, REST APIs",
      ai_experience_level: "Intermediate",
      preferred_learning_track: "Software & platform engineering",
      cubeshackles_ecosystem_interest: "Interested in Angola-first product opportunities",
      problem_to_solve: "Ship a production API with observability and build tools for Angola",
      why_join: "Structured technical education aligned with BIU.G Academy goals and building for Angola.",
      certifications: "N/A",
      tools_used: "VS Code, Git, Node.js",
      consent: true,
    };

    const res = await request("POST", "/api/waitlist", payload);

    assert.equal(res.status, 201, `Expected 201 but got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.ok, true);
    assert.ok(res.body.applicant_id, "applicant_id must be present");
    assert.equal(typeof res.body.score, "number");
    assert.ok(res.body.score >= 0 && res.body.score <= 20, `score ${res.body.score} out of 0-20 range`);
    assert.ok(["money", "business", "digital", "technical"].includes(res.body.track), `unexpected track: ${res.body.track}`);
    assert.ok(["high", "mid", "low"].includes(res.body.priority), `unexpected priority: ${res.body.priority}`);
    assert.equal(res.body.ai_provider, "deterministic");
  });

  it("accepts simplified payload (contact/interest/motivation) and returns 201", async () => {
    const payload = {
      full_name: "Test User",
      contact: "simplified-" + Date.now() + "@example.com",
      interest: "Starting a business",
      motivation: "I want to start and grow a small business in Angola.",
    };

    const res = await request("POST", "/api/waitlist", payload);

    assert.equal(res.status, 201, `Expected 201 but got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.ok, true);
    assert.ok(res.body.applicant_id, "applicant_id must be present");
    assert.equal(typeof res.body.score, "number");
    assert.ok(["money", "business", "digital", "technical"].includes(res.body.track));
    assert.ok(["high", "mid", "low"].includes(res.body.priority));
    assert.equal(res.body.ai_provider, "deterministic");
  });
});
