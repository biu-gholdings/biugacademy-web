"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function getAppliedMigrations(pool) {
  const { rows } = await pool.query(
    "SELECT filename, applied_at FROM schema_migrations ORDER BY filename"
  );
  const applied = new Map();
  for (const row of rows) {
    applied.set(row.filename, row.applied_at);
  }
  return applied;
}

function formatAppliedAt(value) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toISOString();
}

function padEnd(value, width) {
  const text = String(value);
  if (text.length >= width) {
    return text;
  }
  return text + " ".repeat(width - text.length);
}

function printStatusTable(rows) {
  const headers = ["Migration", "Status", "Applied At"];
  const widths = headers.map((header, index) => {
    const dataWidth = rows.reduce((max, row) => Math.max(max, String(row[index]).length), 0);
    return Math.max(header.length, dataWidth);
  });

  const headerLine = headers.map((header, index) => padEnd(header, widths[index])).join(" | ");
  const separator = widths.map((width) => "-".repeat(width)).join("-+-");

  console.log(headerLine);
  console.log(separator);
  for (const row of rows) {
    console.log(
      [
        padEnd(row.migration, widths[0]),
        padEnd(row.status, widths[1]),
        padEnd(row.appliedAt, widths[2]),
      ].join(" | ")
    );
  }
}

async function runMigrationStatus() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required for migration status.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  try {
    console.log("Connecting to database...");
    await pool.query("SELECT 1");
    console.log("Database connection ok.\n");

    await ensureMigrationsTable(pool);
    const files = getMigrationFiles();

    if (files.length === 0) {
      console.log("No migration files found in backend/migrations/.");
      console.log("Nothing to report.");
      return;
    }

    const applied = await getAppliedMigrations(pool);
    const rows = files.map((filename) => {
      const appliedAt = applied.get(filename);
      return {
        migration: filename,
        status: appliedAt ? "applied" : "pending",
        appliedAt: formatAppliedAt(appliedAt),
      };
    });

    printStatusTable(rows);

    const appliedCount = rows.filter((row) => row.status === "applied").length;
    const pendingCount = rows.filter((row) => row.status === "pending").length;

    console.log(`\nSummary: ${appliedCount} applied, ${pendingCount} pending.`);
    if (pendingCount > 0) {
      console.log("Pending migrations require review before production release.");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrationStatus();
}
