"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { scoreApplicant } = require("../scoring");

describe("scoreApplicant", () => {
  it("returns zero for empty application", () => {
    const result = scoreApplicant({});
    assert.equal(result.score, 0);
    assert.equal(result.track, "digital");
    assert.equal(result.priority, "low");
    assert.deepEqual(result.tags, []);
  });

  it("scores Angola-based applicant with long motivation", () => {
    const result = scoreApplicant({
      full_name: "Maria Silva",
      country: "Angola",
      province: "Luanda",
      area_of_interest: "business",
      why_join: "I want to start my own business in Luanda and learn how to manage finances and grow my small enterprise effectively.",
    });
    assert.ok(result.score >= 10, `Expected score >= 10, got ${result.score}`);
    assert.ok(result.tags.includes("angola_context"));
    assert.ok(result.tags.includes("long_motivation"));
  });

  it("infers correct tracks", () => {
    assert.equal(scoreApplicant({ area_of_interest: "Literacia financeira" }).track, "money");
    assert.equal(scoreApplicant({ area_of_interest: "Pequenos negócios" }).track, "business");
    assert.equal(scoreApplicant({ area_of_interest: "Tecnologia / Software" }).track, "technical");
    assert.equal(scoreApplicant({ area_of_interest: "Competências digitais" }).track, "digital");
  });

  it("caps score at 20", () => {
    const result = scoreApplicant({
      full_name: "Test",
      country: "Angola",
      province: "Luanda",
      area_of_interest: "money",
      why_join: "I want to build a strong financial foundation and learn to earn money and grow my savings account in Angola",
      problem_to_solve: "Start a business in Luanda and improve",
    });
    assert.ok(result.score <= 20, `Score ${result.score} exceeds 20`);
  });

  it("returns high priority for score >= 15", () => {
    const result = scoreApplicant({
      country: "Angola",
      area_of_interest: "money",
      why_join: "I want to build a strong financial foundation and learn to earn money and grow my savings account in Angola",
    });
    assert.ok(result.score >= 15);
    assert.equal(result.priority, "high");
  });
});
