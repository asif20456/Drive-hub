# Design — Drive Hub (Open Road)

A locked design system for this app, produced by a Hallmark multi-page redesign.
Every page reads this file before emitting code. Amend this file when the system
needs to grow — do not regenerate per page.

## Genre
editorial — warm print register; hairline structure, serif display, one racing-red signal.

## Macrostructure family
- Marketing / public pages (homepage catalog): **Catalogue**
- Product pages (car detail): **Catalogue + spec-sheet** (editorial product layout)
- App pages (dashboards, fleet manager, bookings, admin): **Workbench** — functional panels, hairline rows, mono labels
- Auth pages (login / register): **centred editorial card**

## Theme — Open Road (custom)
- `--color-paper: oklch(97.5% 0.012 85)` — warm bone
- `--color-paper-2: oklch(94.5% 0.014 85)`
- `--color-paper-3: oklch(90.5% 0.016 85)`
- `--color-ink: oklch(21% 0.016 60)` — warm near-black
- `--color-ink-deep: oklch(16% 0.018 60)`
- `--color-ink-2: oklch(37% 0.014 65)`
- `--color-rule: oklch(86% 0.012 80)` / `--color-rule-2: oklch(75% 0.014 78)`
- `--color-muted: oklch(40% 0.014 70)` / `--color-neutral: oklch(56% 0.008 80)`
- `--color-accent: oklch(50% 0.21 30)` — racing red (≤ 5 % of any viewport)
- `--color-accent-deep: oklch(44% 0.21 30)`
- `--color-accent-soft: oklch(95.5% 0.024 30)`
- `--color-accent-ink: oklch(98% 0.005 80)`
- `--color-focus: oklch(55% 0.17 250)`
- Statuses: `success` / `warn` / `danger` / `info` / `purple` + `-soft` variants (full set in `tokens.css`)

## Typography
- Display: **Fraunces** (roman, 500/600, tracking −0.02em). Italic is never used on headings.
- Body: **IBM Plex Sans** (400/500).
- Mono: **JetBrains Mono** — labels, meta, prices, registration numbers (`font-variant-numeric: tabular-nums`).
- Type scale: major third (1.25) from a 16px body. Hero display ≤ `clamp(2.5rem, 5vw + 1rem, 4.5rem)`.

## Spacing
Tailwind's 4-pt scale. Hairlines carry structure — borders, not drop-shadows.

## Motion
- Easings: `--ease-out` / `--ease-in` / `--ease-in-out` (tokens.css).
- Reveal: none by default (editorial is default-off motion). Hover states only: border-colour shift, underline grow, one CTA lift.
- `prefers-reduced-motion: reduce` collapses all motion to instant final state.

## Microinteractions stance
- Silent success — toasts reserved for failures and effects that hide themselves.
- Hover delay 0 ms; focus rings appear instantly, never animated.
- Button press: `translateY(1px)` at 100 ms, `--ease-out`.

## CTA voice
- Primary CTA: solid ink (near-black) button, 6px radius — `btn-primary`.
- The single booking CTA on the car detail page is the one `btn-accent` (racing-red) button.
- Secondary: hairline-bordered `btn-secondary`. Inline links: `link-arrow` (red hover underline).

## Per-page allowances
- Marketing / catalogue pages lead with car photography.
- App pages: no enrichment — function carries the page.

## What pages MUST share
- The wordmark ("Drive Hub", Fraunces).
- Accent-red placement: price numerals, active nav underline, hover underlines, focus rings, danger states.
- Display + body + mono fonts; the CTA voice; hairline rule language; mono labels.

## What pages MAY differ on
- Section composition within the families above.
- Hero archetype (homepage: compact editorial header; app pages: functional headers).

## Exports
See `tokens.css` at the project root for the full token set (colors, fonts, easings, durations).
