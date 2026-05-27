# GitHub Pages Routing Note

Because GitHub Pages serves `/` from `/index.html` and `/pt/` from `/pt/index.html`, any Portuguese homepage update must be mirrored to both files unless a build system or shared partial system is introduced.

## Language selector requirement

Language buttons must always be real anchor links for GitHub Pages routing. JavaScript may enhance active states but must never control basic navigation.

Required links:

- `href="/pt/"`
- `href="/en/"`
- `href="/fr/"`

Do not use `aria-disabled`, non-clickable placeholder spans, or JavaScript-only language switching for core route navigation.
