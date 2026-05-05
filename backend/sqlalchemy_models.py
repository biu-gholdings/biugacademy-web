from __future__ import annotations

import os
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "sqlite:///./biug_academy.db")


DATABASE_URL = _database_url()
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


class Applicant(Base):
    __tablename__ = "applicants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact: Mapped[str] = mapped_column(String(320), nullable=False)
    phone_normalized: Mapped[str] = mapped_column(String(40), nullable=False)
    interest: Mapped[str] = mapped_column(String(120), nullable=False)
    motivation: Mapped[str] = mapped_column(Text, nullable=False)
    ai_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_track: Mapped[str] = mapped_column(String(40), nullable=False, default="digital")
    cohort_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending|accepted|waitlist|rejected
    whatsapp_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    message_logs: Mapped[list[MessageLog]] = relationship(
        "MessageLog", back_populates="applicant", cascade="all, delete-orphan"
    )
    cohort_events: Mapped[list[CohortEvent]] = relationship(
        "CohortEvent", back_populates="applicant", cascade="all, delete-orphan"
    )


class MessageLog(Base):
    __tablename__ = "message_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False
    )
    direction: Mapped[str] = mapped_column(String(20), nullable=False)  # inbound|outbound
    channel: Mapped[str] = mapped_column(String(20), nullable=False, default="whatsapp")
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(String(50), nullable=False)
    whatsapp_message_id: Mapped[str] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    applicant: Mapped[Applicant] = relationship("Applicant", back_populates="message_logs")


class CohortEvent(Base):
    __tablename__ = "cohort_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    applicant_id: Mapped[int] = mapped_column(
        ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    applicant: Mapped[Applicant] = relationship("Applicant", back_populates="cohort_events")


def init_sqlalchemy_tables() -> None:
    """
    Auto-create tables in development. This keeps setup simple
    while leaving room to add Alembic migrations later.
    """
    app_env = os.getenv("APP_ENV", "development").lower().strip()
    auto_create = os.getenv("AUTO_CREATE_TABLES", "true").lower().strip() == "true"
    if app_env == "development" and auto_create:
        Base.metadata.create_all(bind=engine)
