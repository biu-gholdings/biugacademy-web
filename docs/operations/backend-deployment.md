# Backend deployment

## Purpose

Deployment and hardening guide for BIU.G Academy intake backend (`backend/`) using PostgreSQL with safe migrations.

## Supported targets

- Render
- Railway
- Any Node host with PostgreSQL
- Supabase (database provider)

## Environment variables

Required:

- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — API port (default `3000`)
- `FRONTEND_ORIGIN` — allowed frontend origin (example: `https://biugacademy.org`)
- `NODE_ENV` — `production` in deployment

Optional:

- `OPENAI_API_KEY` (future/optional AI assist layer)

## Migration command

Run before serving traffic:

```bash
npm run migrate
```

This runs:

- `backend/migrations/001_create_waitlist_applications.sql`
- `backend/migrations/002_add_waitlist_metadata_and_indexes.sql`

with migration tracking in `schema_migrations`.

## Render deployment

Suggested settings:

- Build command: `npm install`
- Start command: `npm run migrate && npm start`
- Root directory: `backend`
- Environment variables: set all required vars above

Health checks:

- `/health`
- `/health/db`

## Railway deployment

Suggested settings:

- Project root: `backend`
- Deploy command: `npm run migrate && npm start`
- Set environment variables in Railway dashboard
- Attach PostgreSQL service or external Supabase DB URL

## Supabase PostgreSQL connection

Use Supabase as managed DB provider:

1. Create project in Supabase
2. Copy PostgreSQL URI from project settings
3. Set URI as `DATABASE_URL` in deployment platform
4. Run `npm run migrate`

## CORS configuration

`FRONTEND_ORIGIN` is enforced by backend CORS logic.

Production recommendation:

- Set only `https://biugacademy.org`
- Optionally include `https://www.biugacademy.org` if used

Do not use wildcard origins in production.

## Production checklist

- [ ] `DATABASE_URL` set and validated
- [ ] `FRONTEND_ORIGIN` set to production domain
- [ ] `NODE_ENV=production`
- [ ] `npm run migrate` completes successfully
- [ ] `/health` returns healthy
- [ ] `/health/db` returns connected
- [ ] Waitlist POST tested with structured payload
- [ ] Secrets only in platform env vars (not git)
- [ ] Rate limiting confirmed active
- [ ] Honeypot behavior verified

## CI/testing path (future)

Current CI does not require live DB.

Future path:

1. Start ephemeral PostgreSQL service container in CI
2. Set CI `DATABASE_URL`
3. Run `npm run migrate`
4. Run `npm test`

This allows reproducible schema + test validation without production DB access.
