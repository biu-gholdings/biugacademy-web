"use strict";

const fs = require("fs");
const path = require("path");
const pg = require("pg");

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

async function ensureSchema() {
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = await getPool().connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}

module.exports = { getPool, ensureSchema };
