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

## Migration status and apply

Tracked in PostgreSQL table `schema_migrations`. Migration files live in `backend/migrations/` (for example `001_create_waitlist_applications.sql`, `002_add_waitlist_metadata_and_indexes.sql`).

### Before deploy

From `backend/`:

```bash
npm run migrate:status
```

Review the output table (`Migration | Status | Applied At`). Any row with status `pending` must be reviewed before production release.

### During deploy

```bash
npm run migrate
```

Run pending SQL migrations in filename order.

### After deploy

```bash
npm run migrate:status
```

Confirm all expected migrations show status `applied` and have an `Applied At` timestamp.

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
- [ ] `npm run migrate:status` reviewed before deploy (no unexpected pending rows)
- [ ] `npm run migrate` completes successfully
- [ ] `npm run migrate:status` confirms all migrations applied after deploy
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
