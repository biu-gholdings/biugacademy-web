# Repository maturity checklist

Tracks institutional readiness of `biugacademy-web`. Updated as phases complete.

**Legend:** ✅ Done · 🔄 In progress · ⬜ Planned

---

## Documentation system

| Item                                                                                                                 | Status |
| -------------------------------------------------------------------------------------------------------------------- | ------ |
| `docs/` taxonomy (whitepaper, partnerships, regulatory, operations, curriculum, metrics, governance, branding, i18n) | ✅     |
| Master index `docs/README.md`                                                                                        | ✅     |
| Strategic white paper v1.0                                                                                           | ✅     |
| Root ARCHITECTURE.md                                                                                                 | ✅     |
| Deployment guide                                                                                                     | ✅     |
| PDF export guidance                                                                                                  | ✅     |
| Transparency policy                                                                                                  | ✅     |
| Outcomes framework                                                                                                   | ✅     |
| Partnership framework                                                                                                | ✅     |
| MOU template outline                                                                                                 | ⬜     |
| Annual report template                                                                                               | ⬜     |
| Executive summary one-pager                                                                                          | ⬜     |

---

## Root governance

| Item                         | Status |
| ---------------------------- | ------ |
| README (institutional)       | ✅     |
| CONTRIBUTING                 | ✅     |
| GOVERNANCE                   | ✅     |
| SECURITY                     | ✅     |
| ROADMAP (phases 0–6)         | ✅     |
| CODE_OF_CONDUCT              | ✅     |
| LICENSE (MIT + content note) | ✅     |
| CHANGELOG                    | 🔄     |

---

## Repository hygiene

| Item                    | Status              |
| ----------------------- | ------------------- |
| `.editorconfig`         | ✅                  |
| Prettier (HTML/CSS/MD)  | ✅                  |
| Markdown lint config    | ✅                  |
| README badges           | ✅                  |
| CODEOWNERS              | ✅ (update handles) |
| Issue templates         | ✅                  |
| PR template             | ✅                  |
| Docs lint GitHub Action | ✅                  |
| HTML link checker CI    | ⬜                  |
| PDF release workflow    | ⬜                  |

---

## Product / operations

| Item                         | Status |
| ---------------------------- | ------ |
| Public website live          | ✅     |
| First cohort completed       | ⬜     |
| LMS / CMS                    | ⬜     |
| Production analytics         | ⬜     |
| Offline module distribution  | ⬜     |
| Dedicated security@ email    | ⬜     |
| Formal partnership published | ⬜     |

---

## Recommended next milestones

1. **Complete Phase 1** — Run first cohort with documented outcomes
2. **Publish metrics baseline** — Update `docs/metrics/outcomes-framework.md` after cohort
3. **MOU template** — Legal-reviewed `docs/partnerships/mou-template-outline.md`
4. **Enable PDF release workflow** — Attach white paper PDF on git tag
5. **Assign CODEOWNERS** — Replace placeholder with GitHub team handles
6. **FR curriculum parity** — After PT financial literacy modules exist
7. **Consolidate `apply/` route** — Redirect alias for intake paths
8. **Annual summary template** — When fundraising or grants activate

---

## Disclaimer

Presence in this repository does not imply operational capability. See [../README.md](../README.md) status tables.
