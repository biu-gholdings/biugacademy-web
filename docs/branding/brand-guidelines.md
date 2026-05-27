# Brand guidelines

Visual and communication standards for BIU.G Academy public materials. Applies to the website, documentation, and future print/PDF exports.

---

## Logo usage

| Rule | Detail |
|------|--------|
| Asset | `/assets/biug-academy-logo.png` |
| Clear space | Minimum padding equal to logo height on all sides |
| Proportion | Do not stretch or distort |
| Background | Prefer white or light `--bg`; on dark footer, use unmodified logo |
| Modifications | No unofficial colorways without written approval |
| Co-branding | Partner logos require approved layout templates (planned) |

---

## Typography

| Use | Typeface | Fallback |
|-----|----------|----------|
| Headings | Playfair Display, 700 | Georgia, serif |
| Body | DM Sans, 400–700 | system-ui, sans-serif |

Load only required weights from Google Fonts to support low-bandwidth users.

---

## Color palette

Defined in `css/styles.css`:

| Token | Role | Hex |
|-------|------|-----|
| `--text` | Primary text (navy) | `#0f1f33` |
| `--muted` | Secondary text | `#3f4d61` |
| `--blue-500` | Academy blue accent | `#266fc9` |
| `--blue-700` | Blue hover / emphasis | `#184f96` |
| `--orange-500` | Primary CTA | `#d87824` |
| `--orange-600` | CTA hover | `#be671c` |
| `--bg` | Page background | `#f8fbff` |
| `--card` | Card surface | `#ffffff` |
| `--border` | Dividers | `#d7e2ef` |
| `--footer` | Footer background | `#1d2f45` |

---

## Accessibility contrast rules

| Pairing | Requirement |
|---------|-------------|
| Body text on `--bg` | Meet WCAG AA (4.5:1) for normal text |
| CTA orange on white | Verify contrast for button labels; adjust to `--orange-600` if needed |
| Muted text | Use for secondary content only, not essential instructions |
| Links | `--blue-500` with `--blue-700` hover |

Test changes with a contrast checker before merge.

---

## Components

- Rounded cards (`.tile`, `.grid-cards`)
- Sticky navigation with mobile menu toggle
- Primary CTA: `.btn-primary` (orange)
- Secondary CTA: `.btn-secondary`
- Institutional light theme — no hype gradients or meme styling

---

## Institutional tone

| Do | Do not |
|----|--------|
| Clear, practical, respectful | “Revolutionary,” “disruptive,” trillion-scale claims |
| Angola-first context | Generic imported examples |
| Under development / planned | Imply accreditation or government approval |
| Measurable, modest outcomes | Guaranteed jobs or returns |

Copy standards: [../design/content-style-guide.md](../design/content-style-guide.md)

---

## Communication rules

- Portuguese primary for public messaging
- Regulatory disclaimer on pages describing programs
- No token, crypto, or speculative investment language
- No political campaigning in Academy channels

---

## Related

- [../design/accessibility.md](../design/accessibility.md)
- [../governance/transparency-policy.md](../governance/transparency-policy.md)
