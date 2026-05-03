# BIU.G Academy — AI-native backend intake

Node.js + **Express** + **PostgreSQL** (Supabase) + **OpenAI** JSON classification. This is the intelligence layer for waitlist intake (not a chatbot).

## Layout

| File | Role |
|------|------|
| `server.js` | HTTP server, Helmet, CORS, rate limit, `POST /api/waitlist` |
| `db.js` | PostgreSQL pool + `ensureSchema()` from `schema.sql` |
| `ai.js` | OpenAI call + normalization to allowed enums/scores |
| `schema.sql` | Tables for Supabase SQL Editor or `psql` |

## Supabase database

1. Create a project at [Supabase](https://supabase.com).
2. Open **SQL Editor** → New query.
3. Paste the full contents of **`schema.sql`** → Run.
4. In **Project Settings → Database**, copy the **URI** connection string (use the *transaction* or *session* pooler if you prefer; `DATABASE_URL` must be reachable from your API host).

## Local `.env`

Create **`backend/.env`** (never commit real secrets):

```env
PORT=3000
DATABASE_URL=YOUR_SUPABASE_POSTGRES_CONNECTION_STRING
OPENAI_API_KEY=YOUR_OPENAI_KEY
FRONTEND_ORIGIN=https://biugacademy.org
```

Optional: `OPENAI_MODEL=gpt-4o-mini` (default).

`FRONTEND_ORIGIN` is used for **CORS** (your static site origin). In non-production, common `http://localhost:*` origins are also allowed for local HTML/API testing.

## Install & run

```bash
cd backend
npm install
npm run dev
```

Production:

```bash
npm start
```

On startup the app runs `schema.sql` via `ensureSchema()` (idempotent `IF NOT EXISTS`). If you rely only on Supabase SQL Editor, that is still safe.

## Frontend integration

The waitlist UI must **`POST` JSON** to **`/api/waitlist`** on your API host (see `contact/index.html` meta `biug-api-base`). On **`success`**, redirect the browser to **`/thank-you/`**. The OpenAI key exists only on the server.

## Test with curl

```bash
curl -sS -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "full_name": "Test Applicant",
    "email": "test@example.com",
    "phone": "+244923456789",
    "country": "Angola",
    "province": "Luanda",
    "city": "Luanda",
    "area_of_interest": "Technology / Software",
    "current_role": "Developer",
    "expertise": "JavaScript, PostgreSQL, REST APIs",
    "ai_experience_level": "Intermediate — regular use in workflow",
    "preferred_learning_track": "Software & platform engineering",
    "cubeshackles_ecosystem_interest": "Interested in Angola-first product opportunities",
    "problem_to_solve": "Ship a production API with observability",
    "why_join": "Structured technical education aligned with BIU.G Academy goals.",
    "certifications": "N/A",
    "tools_used": "VS Code, Git, Node.js",
    "consent": true
  }' | jq .
```

Expect **`201`** with `success`, `application_id`, and `ai_profile`.

## Security

- **dotenv** for secrets (`OPENAI_API_KEY`, `DATABASE_URL`).
- **helmet** for default security headers (CSP disabled for JSON API).
- **express-rate-limit** on `POST /api/waitlist`.
- **cors** restricted to `FRONTEND_ORIGIN` (plus `www` variant when applicable) and localhost in development.
- **zod** validation on the request body.
- OpenAI is only called from **`ai.js`** on the server.

## Deploy

Run this service on **Render**, **Railway**, **Fly.io**, or similar; set the same env vars. Keep the static site on `biugacademy.org` and point `biug-api-base` (or a reverse proxy) to your API URL.
