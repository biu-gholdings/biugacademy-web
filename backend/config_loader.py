import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    whatsapp_access_token: str
    whatsapp_phone_number_id: str
    whatsapp_verify_token: str
    whatsapp_app_secret: str
    openai_api_key: str
    database_url: str
    openai_model: str


REQUIRED_ENV_VARS = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_APP_SECRET",
    "OPENAI_API_KEY",
    "DATABASE_URL",
]


def load_settings() -> Settings:
    missing = [key for key in REQUIRED_ENV_VARS if not os.getenv(key, "").strip()]
    if missing:
        missing_list = ", ".join(missing)
        raise RuntimeError(f"Missing required environment variables: {missing_list}")

    return Settings(
        whatsapp_access_token=os.environ["WHATSAPP_ACCESS_TOKEN"].strip(),
        whatsapp_phone_number_id=os.environ["WHATSAPP_PHONE_NUMBER_ID"].strip(),
        whatsapp_verify_token=os.environ["WHATSAPP_VERIFY_TOKEN"].strip(),
        whatsapp_app_secret=os.environ["WHATSAPP_APP_SECRET"].strip(),
        openai_api_key=os.environ["OPENAI_API_KEY"].strip(),
        database_url=os.environ["DATABASE_URL"].strip(),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini",
    )
