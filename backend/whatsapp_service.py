import logging
from typing import Any

import requests
from config_loader import Settings
from sqlalchemy import select

from sqlalchemy_models import Applicant, MessageLog, SessionLocal


logger = logging.getLogger(__name__)
_settings: Settings | None = None


def configure_whatsapp_service(settings: Settings) -> None:
    global _settings
    _settings = settings


def _normalize_phone(value: str) -> str:
    return "".join(ch for ch in str(value) if ch.isdigit())


def _log_outbound_message(
    to_phone: str,
    body: str,
    message_type: str,
    whatsapp_message_id: str | None,
) -> None:
    phone_norm = _normalize_phone(to_phone)
    if not phone_norm:
        return
    try:
        with SessionLocal() as db:
            applicant = db.execute(
                select(Applicant).where(Applicant.phone_normalized == phone_norm)
            ).scalar_one_or_none()
            if not applicant:
                return
            db.add(
                MessageLog(
                    applicant_id=applicant.id,
                    direction="outbound",
                    channel="whatsapp",
                    message_text=body,
                    message_type=message_type,
                    whatsapp_message_id=whatsapp_message_id,
                )
            )
            db.commit()
    except Exception as exc:
        logger.warning("Failed to log outbound WhatsApp message: %s", exc)


def send_whatsapp_text(to_phone: str, body: str) -> dict[str, Any]:
    if _settings is None:
        return {"ok": False, "error": "whatsapp service not configured"}
    if not to_phone or not body:
        return {"ok": False, "error": "to_phone and body are required"}

    url = (
        "https://graph.facebook.com/v20.0/"
        f"{_settings.whatsapp_phone_number_id}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": body},
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {_settings.whatsapp_access_token}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        logger.warning("WhatsApp API request failed: %s", exc)
        return {"ok": False, "error": "request_failed"}

    if not response.ok:
        # Intentionally do not log any token/header data.
        logger.warning("WhatsApp API error status=%s body=%s", response.status_code, response.text[:400])
        return {"ok": False, "status_code": response.status_code, "error": "api_error"}

    try:
        data = response.json()
    except ValueError:
        data = {}

    messages = data.get("messages", []) if isinstance(data, dict) else []
    whatsapp_message_id = None
    if messages and isinstance(messages[0], dict):
        whatsapp_message_id = str(messages[0].get("id") or "").strip() or None

    _log_outbound_message(
        to_phone=to_phone,
        body=body,
        message_type="text",
        whatsapp_message_id=whatsapp_message_id,
    )

    return {
        "ok": True,
        "status_code": response.status_code,
        "whatsapp_message_id": whatsapp_message_id,
    }
