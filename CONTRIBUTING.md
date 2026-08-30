# Contributing to BIU.G Academy

This repository supports an **education infrastructure initiative under development**. Contributors help build documentation, accessibility, translations, and the static public site—subject to institutional standards below.

Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [docs/regulatory/regulatory-position.md](docs/regulatory/regulatory-position.md) before contributing.

---

## Who can contribute

Educators, developers, translators, designers, and institutional reviewers may propose changes via pull request. Maintainers may decline work that introduces hype, false accreditation, undisclosed partnerships, or security risks.

---

## Branch naming

| Prefix     | Use                        |
| ---------- | -------------------------- |
| `docs/`    | Documentation only         |
| `fix/`     | Bug fix (site or tooling)  |
| `content/` | Public copy (extra review) |
| `i18n/`    | Translation updates        |
| `chore/`   | Tooling, lint, templates   |

Examples: `docs/update-transparency-policy`, `i18n/fr-cohort-page`

---

## Commit style

- Imperative subject: `docs: add deployment guide`
- One logical change per commit when practical
- Reference issues in the body when applicable

---

## Pull request standards

Use [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).

Required confirmations:

- [ ] No secrets, API keys, or personal data
- [ ] No new accreditation, licensing, or government approval claims
- [ ] No undisclosed partnerships
- [ ] Languages touched listed (PT / EN / FR)
- [ ] Status labels correct (operational vs planned)
- [ ] Every new or moved document is registered in the [docs/README.md](docs/README.md) taxonomy, and any doc it contradicts is updated
- [ ] [CHANGELOG.md](CHANGELOG.md) updated under `## [Unreleased]` for any user-facing or operational change
- [ ] All CI checks green (`markdownlint`, `prettier-check`) before review is requested

These apply to **every** pull request, without exception. Run the formatter locally before pushing:

```bash
npx prettier@3.5.3 --write "**/*.{md,html,css,js,yml,yaml}" --ignore-path .prettierignore
```

---

## Documentation expectations

| Rule        | Detail                                                   |
| ----------- | -------------------------------------------------------- |
| Tone        | Institutional, clear, no hype                            |
| Status      | Label operational / under development / planned          |
| Links       | Use relative links within `docs/`                        |
| Structure   | Follow [docs/README.md](docs/README.md) taxonomy         |
| Disclaimers | Preserve regulatory language on public copy              |
| Changelog   | Update [CHANGELOG.md](CHANGELOG.md) for notable releases |

Architecture or roadmap changes must update [ARCHITECTURE.md](ARCHITECTURE.md) and/or [ROADMAP.md](ROADMAP.md).

---

## Accessibility requirements

- Semantic HTML (`header`, `main`, `nav`, `footer`)
- Meaningful `alt` text on images (or `alt=""` when decorative)
- Visible focus states for interactive elements
- Sufficient color contrast per [docs/branding/brand-guidelines.md](docs/branding/brand-guidelines.md)
- Mobile navigation usable without hover-only interactions

See [docs/design/accessibility.md](docs/design/accessibility.md).

---

## Multilingual support expectations

| Language            | Priority                               |
| ------------------- | -------------------------------------- |
| Portuguese (Angola) | Primary — source of truth for new copy |
| English             | Secondary — maintain semantic parity   |
| French              | Later — update when PT/EN stable       |

- Use [docs/i18n/translation-glossary.md](docs/i18n/translation-glossary.md) for key terms
- Regulatory disclaimers must match in **meaning** across locales
- Prefer human review over machine-only translation for public pages

---

## Mobile-first rules

- Test changes at ~375px width minimum
- Do not rely on hover-only affordances
- Keep tap targets adequately sized
- Avoid horizontal scroll on primary flows

---

## Low-bandwidth optimization rules

- No new heavy frameworks without maintainer approval
- Minimize additional HTTP requests per page
- Prefer system fonts fallbacks; limit font weights loaded
- Avoid large unoptimized images; compress assets
- Do not add autoplay video to public pages
- Keep JavaScript small and defer non-critical scripts

---

## Static site constraints

- No React, Next.js, Vite, or similar unless explicitly approved
- Do not embed API keys in client-side code
- Preserve existing CSS design tokens unless a design issue documents a change

---

## Review process

1. Automated checks (markdown lint) when CI is enabled
2. Maintainer review for content accuracy and regulatory language
3. Merge to default branch → GitHub Pages deploy

---

## Getting started

- [docs/community/contributor-onboarding.md](docs/community/contributor-onboarding.md)
- [docs/operations/deployment-guide.md](docs/operations/deployment-guide.md)
- [docs/branding/brand-guidelines.md](docs/branding/brand-guidelines.md)
