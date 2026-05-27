# Admin dashboard planning

## Scope

This document defines a practical dashboard plan for intake operations. It is planning-only and does not imply current deployment.

## Goals

- Give operators a structured view of applicants
- Support cohort selection with transparent filters
- Keep manual review central in early phases
- Provide export tools for operational and institutional reporting

## Core modules

| Module           | Purpose                               | Phase   |
| ---------------- | ------------------------------------- | ------- |
| Applicant list   | Central list of submitted records     | Planned |
| Applicant detail | Full profile and notes                | Planned |
| Filter panel     | Province, language, interests, status | Planned |
| Tagging          | Cohort and scholarship tags           | Planned |
| Export center    | CSV/JSON exports                      | Planned |
| Metrics snapshot | High-level counts and trends          | Planned |

## Applicant filtering

Primary filter dimensions:

- Submission date range
- Province
- Municipality
- Primary language
- Areas of interest
- Internet access level
- Device access
- Employment status
- Review status
- Cohort tag
- Scholarship tag

## Province analytics

Initial dashboard widgets:

- Applicants per province
- Applicants per municipality (top 10)
- Connectivity constraints by province
- Distribution of areas of interest by province

## Language segmentation

Segment by:

- `primary_language`
- Browser language metadata (secondary signal)

Use case:

- Content translation prioritization
- Facilitator language assignment

## Export tools

Formats:

- CSV for spreadsheet workflows
- JSON for technical pipelines

Recommended export presets:

- All applicants (date-scoped)
- Province-specific list
- Cohort-shortlist export
- Scholarship-candidate export

## Cohort tagging

Planned tags:

- `cohort_1_candidate`
- `cohort_1_shortlist`
- `cohort_1_waiting`
- `cohort_1_selected`
- `deferred_next_cycle`

Tagging rule:

- Manual operator action with audit note

## Manual review workflow

1. Intake received
2. Validation check
3. Manual profile read
4. Optional follow-up contact
5. Tagging decision
6. Final status update

No automated admission decision in Phase 1.

## Scholarship tagging

Suggested fields:

- `scholarship_interest` (boolean)
- `scholarship_review_status` (enum)
- `scholarship_notes` (text)

Initial approach:

- Keep scholarship handling manual
- Add criteria documentation before scale

## Security and access

- Role-based access for dashboard users
- Read/write audit logging
- Least-privilege DB roles
- No public dashboard endpoints

## Delivery sequence (recommended)

1. Read-only list view
2. Filter and export
3. Tagging and notes
4. Metrics snapshots
5. Role-based access controls
