import os
import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "biugacademy.db"


def get_db_path() -> str:
    db_url = os.getenv("DATABASE_URL", "").strip()
    if db_url.startswith("sqlite:///"):
        relative_or_abs = db_url.replace("sqlite:///", "", 1)
        return str((BASE_DIR / relative_or_abs).resolve()) if relative_or_abs.startswith(".") else relative_or_abs
    return os.getenv("SQLITE_DB_PATH", str(DEFAULT_DB_PATH))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                track TEXT NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                cohort TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS modules (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                module_id TEXT NOT NULL,
                reply TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
            CREATE INDEX IF NOT EXISTS idx_checkins_module_id ON checkins(module_id);
            """
        )
        conn.commit()
    finally:
        conn.close()
