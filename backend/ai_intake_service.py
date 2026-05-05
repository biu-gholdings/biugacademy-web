from __future__ import annotations

from typing import Any, Literal

from sqlalchemy.orm import Session

from sqlalchemy_models import Applicant


Track = Literal["money", "business", "digital", "technical"]
Priority = Literal["high", "mid", "low"]

ANGOLA_HINTS = [
    "aoa",
    "kz",
    "luanda",
    "benguela",
    "huila",
    "huambo",
    "cabinda",
    "malanje",
    "namibe",
    "uige",
    "bengo",
    "bié",
    "bie",
    "lunda norte",
    "lunda sul",
    "moxico",
    "zaire",
    "cunene",
    "kwanza norte",
    "kwanza sul",
    "cuando cubango",
]

ACTION_WORDS = ["build", "start", "learn", "earn", "improve", "grow"]


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def normalize_phone(value: Any) -> str:
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def is_phone_contact(value: Any) -> bool:
    return len(normalize_phone(value)) >= 8


def _contains_any(text: str, words: list[str]) -> bool:
    return any(word in text for word in words)


def _infer_track(interest: str) -> Track:
    i = _norm(interest)
    if "money" in i:
        return "money"
    if "business" in i:
        return "business"
    if "technical" in i:
        return "technical"
    return "digital"


def _priority_from_score(score: int) -> Priority:
    if score >= 15:
        return "high"
    if score >= 10:
        return "mid"
    return "low"


def _cohort_status_from_score(score: int) -> str:
    if score >= 15:
        return "accepted"
    if score >= 10:
        return "waitlist"
    return "pending"


def score_applicant(applicant: dict[str, Any] | Applicant) -> dict[str, Any]:
    """
    Deterministic AI-native intake scorer.
    Input can be a dict-like payload or SQLAlchemy Applicant model.
    """
    name = _norm(getattr(applicant, "name", None) if not isinstance(applicant, dict) else applicant.get("name"))
    contact = _norm(getattr(applicant, "contact", None) if not isinstance(applicant, dict) else applicant.get("contact"))
    interest = _norm(getattr(applicant, "interest", None) if not isinstance(applicant, dict) else applicant.get("interest"))
    motivation = _norm(
        getattr(applicant, "motivation", None) if not isinstance(applicant, dict) else applicant.get("motivation")
    )

    combined = f"{name} {contact} {interest} {motivation}"
    tags: list[str] = []
    score = 0
    reasons: list[str] = []

    if len(motivation) > 60:
        score += 5
        tags.append("long_motivation")
        reasons.append("motivation length > 60")

    if _contains_any(combined, ANGOLA_HINTS):
        score += 5
        tags.append("angola_context")
        reasons.append("Angola/AOA/Kz/province hint found")

    if interest in {"money", "business"}:
        score += 5
        tags.append("commercial_interest")
        reasons.append("interest is money or business")

    if _contains_any(combined, ACTION_WORDS):
        score += 5
        tags.append("action_words_present")
        reasons.append("action words found")

    track = _infer_track(interest)
    priority = _priority_from_score(score)

    return {
        "score": score,
        "track": track,
        "priority": priority,
        "reason": "; ".join(reasons) if reasons else "insufficient qualifying signals",
        "tags": tags,
    }


def save_score_to_applicant(db: Session, applicant: Applicant) -> dict[str, Any]:
    """
    Score applicant and persist ai_score, ai_track, cohort_status.
    """
    result = score_applicant(applicant)
    applicant.ai_score = int(result["score"])
    applicant.ai_track = str(result["track"])
    applicant.cohort_status = _cohort_status_from_score(int(result["score"]))
    db.add(applicant)
    db.commit()
    db.refresh(applicant)
    return result
