# Data intake architecture

## Current state

Intake is **front-end initiated** and **externally bridged**:

1. Applicant completes static HTML form (localized cohort page).
2. Browser submits to a configured endpoint (e.g. serverless script or future API).
3. Maintainers review submissions manually during early phases.

No production database is required for Phase 0 GitHub Pages operation.

## Planned state (Phase 3+)

```
Static frontend
      │
      ▼
Application API  ──►  Database
      │                    │
      │                    ▼
      │              Admin dashboard
      ▼
 (optional) AI assist ──► human reviewer
```

## Data principles

| Principle | Implementation direction |
|-----------|-------------------------|
| Minimization | Collect only fields needed for cohort selection |
| Purpose limitation | Use data for education admissions, not unrelated marketing resale |
| Retention | Define retention windows before production storage |
| Access control | Role-based admin; audit access to PII |
| No secrets in repo | Credentials only in secure environment configuration |

## Fields (illustrative, subject to change)

Planned application signals may include:

- Motivation and learning goals
- Location (Angola priority)
- Availability
- Track interest (financial literacy, digital, business, technical)
- Contact method (email / phone as voluntarily provided)

Exact schemas will be versioned when an API is introduced.

## Abuse considerations

See [../../SECURITY.md](../../SECURITY.md) — rate limiting, spam detection, and manual review are expected in early cohorts.

## Not in scope for this document

Implementing the API or database in this repository phase. Architecture only.
