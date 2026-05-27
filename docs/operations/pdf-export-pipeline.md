# PDF export pipeline

Guidance for publishing institutional PDFs (white paper, annual summary, partner briefs) from repository markdown. **Automation is planned**; manual export is supported today.

---

## Use cases

| Document | Source |
|----------|--------|
| Strategic white paper | `docs/whitepaper/biug-academy-whitepaper-v1.md` |
| Executive summary (future) | Planned one-pager |
| Annual report (future) | Planned template |

---

## Tooling options

### Pandoc (local — operational)

**Prerequisites:** [Pandoc](https://pandoc.org/) 3.x+, optional LaTeX for PDF engine.

```bash
cd biugacademy-web
pandoc docs/whitepaper/biug-academy-whitepaper-v1.md \
  -o dist/biug-academy-whitepaper-v1.pdf \
  --from markdown \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  --toc \
  --metadata title="BIU.G Academy Strategic White Paper v1.0"
```

Create `dist/` locally; **do not commit** large binaries unless release policy changes.

### GitHub Actions (planned)

Example workflow pattern (not yet required for site deploy):

```yaml
# .github/workflows/pdf-release.yml (illustrative)
name: PDF release
on:
  release:
    types: [published]
jobs:
  build-pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker://pandoc/latex:3.5
        with:
          args: >-
            docs/whitepaper/biug-academy-whitepaper-v1.md
            -o biug-academy-whitepaper-v1.pdf
            --toc
      - uses: actions/upload-release-asset@v4
        with:
          files: biug-academy-whitepaper-v1.pdf
```

Enable when maintainers want release-attached PDFs.

---

## Institutional formatting standards

| Element | Standard |
|---------|----------|
| Title page | Initiative name, version, date, author line |
| Disclaimer | Under development; no accredited degrees |
| Headings | Numbered sections for white paper |
| Tone | Match [../branding/brand-guidelines.md](../branding/brand-guidelines.md) |
| Status labels | Preserve operational / planned language |
| Footer | Page numbers, document version, biugacademy.org |

Optional: maintain `docs/whitepaper/pdf-metadata.yaml` for Pandoc variables (planned).

---

## Mermaid diagrams in PDF

Pandoc does not render Mermaid natively. Options:

1. Pre-render diagrams to SVG/PNG for PDF builds (planned script)
2. Use HTML intermediate: `pandoc -t html5` + mermaid-cli (planned)
3. Omit diagrams in PDF appendix and link to git-hosted markdown

---

## Quality checklist before publishing PDF

- [ ] Version and date on cover
- [ ] Regulatory disclaimer present
- [ ] No implied government approval
- [ ] No future systems described as live
- [ ] Contact email correct: support@biugacademy.org

---

## Related

- [deployment-guide.md](deployment-guide.md)
- [../whitepaper/biug-academy-whitepaper-v1.md](../whitepaper/biug-academy-whitepaper-v1.md)
