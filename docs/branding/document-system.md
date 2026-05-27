# Institutional document system

## Purpose

Standardize all outward-facing BIU.G Academy documents so regulators, partners, universities, NGOs, and donors receive consistent institutional materials.

This system applies to:

- white papers
- annual reports
- partnership proposals
- donor proposals
- cohort reports
- curriculum reports
- governance reports

## Design and identity standards

Use the visual identity in [brand-guidelines.md](brand-guidelines.md):

- institutional light theme
- navy text and academy blue accents
- orange only for emphasis or CTA blocks
- clean typography hierarchy
- no hype visuals or speculative framing

For PDFs, prefer high readability over decorative layout.

## Mandatory document structure

Every institutional document should include:

1. Cover page
2. Executive summary
3. Main body sections
4. Risks/limitations (where relevant)
5. Next actions
6. Document control section

## Required metadata block

At the beginning of each source document, include front matter:

```yaml
title: "Document title"
document_type: "whitepaper | report | proposal | governance"
version: "1.0"
status: "draft | internal | public"
prepared_by: "Name / team"
reviewed_by: "Name / team"
approved_by: "Name / role"
date: "YYYY-MM-DD"
language: "pt-AO | en-US | bilingual"
confidentiality: "public | internal | restricted"
copyright: "Biu-g Holdings LLC"
```

## Footer standard

Each exported PDF should include a footer with:

- `BIU.G Academy`
- document short title
- version number
- publication date
- page number (`Page X of Y`)
- confidentiality label (`Public`, `Internal`, or `Restricted`)

Example:

`BIU.G Academy | Annual Report 2026 | v1.0 | 2026-12-31 | Public | Page 4 of 18`

## Versioning rules

| Version type    | Rule                                     |
| --------------- | ---------------------------------------- |
| Major (`1.0`)   | Structural or policy-level change        |
| Minor (`1.1`)   | Section additions or substantial updates |
| Patch (`1.1.1`) | Typos, formatting, non-substantive edits |

Version changes must be logged in the document control table.

## Confidentiality notes

Use one of these labels on cover and footer:

- **Public**: safe for website/repository publication
- **Internal**: for internal planning and partner review only
- **Restricted**: limited circulation; requires explicit authorization

Never publish personal applicant data in outward-facing reports.

## Copyright and usage

Use this line on institutional PDFs:

`Copyright © <year> Biu-g Holdings LLC. All rights reserved.`

If sharing with partners, include:

`No redistribution or modification without written authorization, unless explicitly stated.`

## Document control section (required)

Every final template includes a control table:

| Field        | Value                         |
| ------------ | ----------------------------- |
| Document ID  | `<type>-<year>-<number>`      |
| Version      | `x.y.z`                       |
| Owner        | `<team/role>`                 |
| Review cycle | `quarterly / annual / ad hoc` |
| Last updated | `YYYY-MM-DD`                  |
| Next review  | `YYYY-MM-DD`                  |

## Bilingual-ready formatting standard

Allowed bilingual approaches:

1. **Single-language primary + translated appendix**
2. **Parallel sections (PT then EN)**

Recommended for institutional clarity:

- Portuguese primary for Angola-facing public documents
- English version as separate companion file when possible

Naming convention:

- `*-pt.md`
- `*-en.md`
- `*-bilingual.md` (only when truly required)

## Repository template system

Templates are maintained under:

- `templates/whitepaper/`
- `templates/reports/`
- `templates/partnerships/`
- `templates/governance/`

These templates are source-of-truth for future PDF exports.

## PDF production alignment

Use [../operations/pdf-export-pipeline.md](../operations/pdf-export-pipeline.md) for export mechanics (Pandoc/GitHub Actions).
