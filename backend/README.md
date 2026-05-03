# BIU.G Academy backend — AI intake

Node.js + Express service that receives waitlist applications, persists them in PostgreSQL (or Supabase Postgres), runs **OpenAI JSON classification** (not a chatbot), and returns a structured `ai_profile` for the CubeShackles / BIU.G talent pipeline.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness check |
| POST | `/api/waitlist` | Accept JSON application, store row, run AI, store profile |

## Setup

1. **Copy environment file**

   ```bash
   cp .env.example .env
   ```

   Fill in `DATABASE_URL`, `OPENAI_API_KEY`, and optionally `PORT`, `FRONTEND_ORIGIN`, `ALLOWED_ORIGINS`, `OPENAI_MODEL`.

2. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Create tables**

   Either run SQL manually:

   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   ```

   Or use the helper (reads `DATABASE_URL` from `.env`):

   ```bash
   npm run db:init
   ```

   On first boot, `npm start` also runs `CREATE TABLE IF NOT EXISTS` via `ensureSchema()`.

4. **Run locally**

   ```bash
   npm run dev
   ```

   Server listens on `PORT` (default **3000**).

## Test with curl

Replace the JSON with realistic values. `consent` must be boolean `true`.

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
    "certifications": "N/A",
    "ai_experience_level": "Intermediate — use Copilot weekly",
    "preferred_learning_track": "Software & platform engineering",
    "cubeshackles_ecosystem_interest": "Interested in builder tools and Angola-first product opportunities",
    "tools_used": "VS Code, Git, Docker, Node.js",
    "problem_to_solve": "Ship a production API with observability and clean data models",
    "why_join": "I want structured Angola-aligned technical education and a path into the ecosystem.",
    "consent": true
  }' | jq .
```

Expect `201` with `success`, `application_id`, and `ai_profile`.

## Frontend

The static site’s waitlist form should POST JSON to your deployed API base URL. Configure the meta tag in `contact/index.html`:

```html
<meta name="biug-api-base" content="https://your-api.example.com">
```

Leave empty for **same-origin** `/api/waitlist` (e.g. reverse proxy in front of Node + static files).

## Security notes

- **Never** expose `OPENAI_API_KEY` in the browser; only this backend calls OpenAI.
- Validate required fields and email format on the server (implemented).
- **Rate limiting**: `POST /api/waitlist` is limited (see `waitlistRoute.js`).
- **CORS**: Allows `https://biugacademy.org`, `https://www.biugacademy.org`, common `localhost` dev ports, plus `FRONTEND_ORIGIN` / `ALLOWED_ORIGINS`.

## Deploy later

Suitable hosts include **Render**, **Railway**, **Fly.io**, or a small VPS. Set the same environment variables on the platform. For **Supabase**, use the project’s **Database** connection string as `DATABASE_URL`; you can still run this API on Render/Railway while data lives in Supabase Postgres.

**Supabase Edge Functions** are another option, but this repo uses a standard Node server for clarity and local `npm run dev`.

## Failure behavior

If OpenAI classification fails after the application row is inserted, the service **rolls back** by deleting that application so you do not accumulate unaudited rows. If the AI profile insert fails, the application row is also removed.
