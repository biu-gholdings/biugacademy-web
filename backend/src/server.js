import "dotenv/config";
import express from "express";
import cors from "cors";
import { getPool, ensureSchema } from "./db.js";
import waitlistRouter from "./waitlistRoute.js";

const PORT = Number(process.env.PORT) || 3000;

function buildCorsOptions() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaults = [
    "https://biugacademy.org",
    "https://www.biugacademy.org",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  const allowed = new Set([...fromEnv, ...defaults]);

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowed.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  };
}

const app = express();
app.set("trust proxy", 1);

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "biug-academy-backend" });
});

app.use("/api", waitlistRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

async function start() {
  try {
    getPool();
    await ensureSchema();
  } catch (e) {
    console.error("Database init failed:", e.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`BIU.G Academy backend listening on port ${PORT}`);
  });
}

start();
