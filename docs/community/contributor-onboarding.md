# Contributor onboarding

Welcome. This repository documents an **education infrastructure initiative under development**—not a finished university or LMS product.

---

## Before your first PR

1. Read [../../README.md](../../README.md) status tables (operational / under development / planned)
2. Read [../../CONTRIBUTING.md](../../CONTRIBUTING.md) and [../../CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)
3. Review [../regulatory/regulatory-position.md](../regulatory/regulatory-position.md)
4. For copy/design: [../branding/brand-guidelines.md](../branding/brand-guidelines.md)

---

## Local setup

```bash
git clone https://github.com/biu-gholdings/biugacademy-web.git
cd biugacademy-web
python3 -m http.server 8080
```

Open `http://localhost:8080/pt/` and test your changes at mobile width.

---

## Common contribution types

| Type          | Path                | Review focus            |
| ------------- | ------------------- | ----------------------- |
| Documentation | `docs/`             | Accuracy, status labels |
| Translation   | `pt/`, `en/`, `fr/` | Glossary parity         |
| Accessibility | HTML, CSS           | Contrast, semantics     |
| Intake copy   | cohort pages        | Regulatory disclaimer   |

---

## What not to submit

- Secrets or API keys
- Claims of accreditation, licensing, or government partnership
- Hype marketing language
- Unverified statistics presented as fact

---

## Getting help

- Issues: use templates under `.github/ISSUE_TEMPLATE/`
- Email: [support@biugacademy.org](mailto:support@biugacademy.org)

---

## Related

- [roles.md](roles.md)
- [../REPOSITORY_MATURITY.md](../REPOSITORY_MATURITY.md)
