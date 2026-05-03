/**
 * Apply schema.sql using DATABASE_URL from .env
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sqlPath = path.join(__dirname, "..", "sql", "schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log("Schema applied successfully.");
} finally {
  await client.end();
}
