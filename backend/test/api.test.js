"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://biug:biug_dev_pass@127.0.0.1:5432/biug_academy";

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
  } catch {
    /* ignore */
  }
});

describe("GET /api/health", () => {
  it("returns ok: true", async () => {
    const res = await request("GET", "/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.service, "biug-academy-intake-api");
    assert.equal(res.body.status, "healthy");
  });
});

describe("POST /api/waitlist", () => {
  it("returns 400 on empty body", async () => {
    const res = await request("POST", "/api/waitlist", {});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it("returns 201 for valid intake payload", async () => {
    const payload = {
      full_name: "Test Applicant",
      email: "test-" + Date.now() + "@example.com",
      phone_number: "+244923456789",
      whatsapp_number: "+244923456789",
      province: "Luanda",
      municipality: "Luanda",
      age_range: "25-34",
      primary_language: "Portuguese",
      education_level: "Secondary",
      areas_of_interest: ["financial-literacy", "digital-skills"],
      technical_background: "Basic digital tools and customer support",
      internet_access_level: "Mobile data only",
      device_access: "Smartphone only",
      employment_status: "Informal worker",
      linkedin_optional: "",
      github_optional: "",
      motivation_statement:
        "I want to improve my practical skills to grow income opportunities and support my family.",
      consent_checkbox: true,
      source_platform: "biugacademy-web",
      browser_language: "pt-AO",
      timezone: "Africa/Luanda",
      referral_source: "website-home",
      submission_timestamp: new Date().toISOString(),
      honeypot: "",
    };

    const res = await request("POST", "/api/waitlist", payload);

    assert.equal(
      res.status,
      201,
      `Expected 201 but got ${res.status}: ${JSON.stringify(res.body)}`
    );
    assert.equal(res.body.ok, true);
    assert.ok(res.body.applicant_id, "applicant_id must be present");
    assert.equal(res.body.status, "received");
  });

  it("returns 409 for duplicate email or phone", async () => {
    const payload = {
      full_name: "Duplicate Applicant",
      email: "duplicate-" + Date.now() + "@example.com",
      phone_number: "+244900000001",
      whatsapp_number: "+244900000001",
      province: "Luanda",
      municipality: "Belas",
      age_range: "25-34",
      primary_language: "Portuguese",
      education_level: "Secondary",
      areas_of_interest: ["digital-skills"],
      technical_background: "Beginner",
      internet_access_level: "Mobile data only",
      device_access: "Smartphone only",
      employment_status: "Seeking employment",
      linkedin_optional: "",
      github_optional: "",
      motivation_statement:
        "I want to join this cohort and improve practical capabilities for the local economy.",
      consent_checkbox: true,
      source_platform: "biugacademy-web",
      browser_language: "pt-AO",
      timezone: "Africa/Luanda",
      referral_source: "website",
      submission_timestamp: new Date().toISOString(),
      honeypot: "",
    };

    const first = await request("POST", "/api/waitlist", payload);
    assert.equal(first.status, 201);

    const second = await request("POST", "/api/waitlist", payload);
    assert.equal(second.status, 409);
    assert.equal(second.body.success, false);
  });

  it("silently accepts honeypot spam payload", async () => {
    const res = await request("POST", "/api/waitlist", {
      honeypot: "bot-filled",
    });
    assert.equal(res.status, 202);
    assert.equal(res.body.ok, true);
  });
});
