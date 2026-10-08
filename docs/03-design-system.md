# 03 — Design System

Extracted from the prototype `:root` custom properties (light + dark) and the recovered CSS-module primitives. These are exact values from the source of truth — do not regenerate a generic system.

The brand is built from the logo: the **arch** (threshold / beginning) and the **dot** (you, here, now). The dot marks active/selected state; the arch drives the readiness meter, image frames and guest-journey connectors.

---

## Color System

Tokens are CSS custom properties. Production keeps the same names (recommend exposing as `--color-*` aliases used by the CSS modules — e.g. `--color-accent: var(--dot)`).

### Light (default)
| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#F5F3EE` | page background (logo ivory) |
| `--bg2` | `#ECE8E0` | secondary background |
| `--sf` | `#FBFAF7` | surface |
| `--rs` | `#FFFFFF` | raised surface |
| `--line` | `#E3DED4` | border |
| `--line2` | `#CFC8BB` | strong border |
| `--ink` | `#272523` | primary text (logo ink) |
| `--ink2` | `#4A4540` | secondary text |
| `--mut` | `#6F685E` | muted text |
| `--dot` | `#A69A89` | brand accent (taupe dot) |
| `--dotd` | `#7A6E5E` | text-safe deep taupe |
| `--onink` | `#F5F3EE` | text on ink/accent |

### Dark
| Token | Value |
| --- | --- |
| `--bg` | `#12110F` (warm near-black) |
| `--bg2` | `#1C1A18` |
| `--sf` | `#191816` |
| `--rs` | `#211F1D` |
| `--line` | `rgba(238,233,223,.09)` |
| `--line2` | `rgba(238,233,223,.18)` |
| `--ink` | `#EEE9DF` |
| `--ink2` | `#D2CBBF` |
| `--mut` | `#A39B8E` |
| `--dot` | `#B8AB97` |
| `--dotd` | `#CDBFA9` |
| `--onink` | `#12110F` |

### Status (muted; used only for status)
| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--ok` / `--okb` | `#4C6A4E` / `#E3EADF` | `#A3C29E` / `rgba(163,194,158,.13)` | success / success bg |
| `--wt` / `--wtb` | `#8A5D1E` / `#F2E7D2` | `#DDB474` / `rgba(221,180,116,.13)` | warning / warning bg |
| `--no` / `--nob` | `#A3462F` / `#F3DFD7` | `#E89580` / `rgba(232,149,128,.14)` | error / error bg |
| `--in` / `--inb` | `#3E5868` / `#DEE6EA` | `#9DBACB` / `rgba(157,186,203,.13)` | info / info bg |

### Theme switching
Theme is applied via `data-theme="light|dark"` on `:root` and persisted in `localStorage`. Default follows `prefers-color-scheme`; user choice overrides. Dark mode uses its own transparent-ivory logo artwork.

---

## Typography

| Token | Value |
| --- | --- |
| `--serif` (display) | `'Newsreader', Georgia, serif` |
| `--sans` (body) | `'Instrument Sans', system-ui, sans-serif` |

- **Display / headings:** Newsreader. Section titles `clamp(1.75rem, 4vw, 2.5rem)`, margin `0 0 .75rem`.
- **Body:** Instrument Sans. Prose line-height `1.7`, max width `42rem`.
- **Lead text:** muted colour, max width `40rem`.
- **Labels / chips:** `.75rem`.
- Load via `next/font` (self-hosted) for performance and no layout shift.

---

## Spacing

- Page / section padding: `3rem 1.25rem` (marketing section), content max width `72rem`.
- Hero padding: `3rem 1.25rem 4rem`, grid gap `2rem`.
- Card padding: `1rem`–`1.25rem`.
- Grid gaps: `0.5rem`–`1rem`.
- Header padding: `0.75rem 1.25rem`.
- Modal padding: `1.25rem`.

Recommended scale (rem): `0.25 / 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2 / 3 / 4`.

## Border radius

| Use | Value |
| --- | --- |
| Pill (buttons, chips) | `999px` |
| Input | `0.5rem` |
| Card | `0.75rem` |
| Modal | `0.75rem` |
| Skeleton | `0.35rem` |

## Shadows

| Token | Light | Dark |
| --- | --- | --- |
| `--sh` (card) | `0 1px 2px rgba(39,37,35,.04), 0 18px 40px -22px rgba(39,37,35,.25)` | `0 20px 40px -22px rgba(0,0,0,.7)` |
| `--sh2` (elevated / modal) | `0 40px 80px -34px rgba(39,37,35,.42), 0 8px 22px -10px rgba(39,37,35,.14)` | `0 50px 100px -34px rgba(0,0,0,.85), 0 0 0 1px rgba(238,233,223,.06)` |
| `--glow` | `rgba(166,154,137,.10)` | `rgba(184,171,151,.13)` |

## Gradients

- **Gold foil** (3D invitation card only): `#9C7740 → #E6CD94 (.35) → #B48E52 (.55) → #EBD6A4 (.8) → #8F6C3A`.
- **Skeleton shimmer:** `linear-gradient(90deg, var(--mut), transparent, var(--mut))`, animated `200% → -200%`.
- **Translucent surfaces:** `color-mix(in srgb, var(--bg) 92%, transparent)` with `backdrop-filter: blur(8px)` for sticky header.

Colour mixing uses CSS `color-mix(in srgb, …)` throughout — keep it; it is how the prototype derives subtle fills from tokens.

## Icons

Custom inline SVGs (arch, dot, nav glyphs). No icon-font dependency. Keep as a typed inline-SVG icon set / React components. (The build did not bundle lucide; do not add an icon library.)

## Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `--eo` | `cubic-bezier(.16,1,.3,1)` | ease-out (entrances) |
| `--sp` | `cubic-bezier(.34,1.56,.64,1)` | spring/overshoot |
| fx ease | `cubic-bezier(.2,.75,.15,1)` | motion layer transitions |
| magnetic | `transform .2s ease` | magnetic hover |

Focus ring: `outline: 2px solid #C9A56E; outline-offset: 3px` (gold), applied on `:focus-visible`. All motion gated by `prefers-reduced-motion: reduce`.

---

## Breakpoints

Derived from prototype media queries:

| Name | Min width | Notes |
| --- | --- | --- |
| Mobile | base | single column |
| Tablet | ~`600px` | two-column grids begin |
| Desktop | `900px` | hero + major two-column layouts (`@media (min-width:900px)`) |
| Wide | `1200px` | max content `72rem` centered |

Grids mostly use intrinsic `repeat(auto-fill, minmax(14rem, 1fr))`, reducing reliance on fixed breakpoints.

---

## Primitive components (recovered from build CSS modules)

These `ds_*` classes define the shared primitives — reimplement as CSS-module components with identical rules:

- **Button** — pill, `1px solid var(--mut)` border, transparent bg, body font. Variants: `primary` (accent bg, `--onink`/`--bg` text), `ghost` (transparent border).
- **Input** — full width, radius `.5rem`, border `--mut`, bg `color-mix(in srgb, var(--bg) 92%, var(--ink))`.
- **Chip** — pill `.15rem .65rem`, `.75rem`, subtle fill `color-mix(in srgb, var(--ink) 8%, transparent)`; active = `outline: 2px solid var(--accent)`.
- **Modal** — fixed backdrop `rgba(0,0,0,.55)` grid-centered z50; panel bg surface, border, radius `.75rem`, `min-width: min(92vw, 28rem)`.
- **Skeleton** — shimmer gradient, `1.2s linear infinite`, disabled under reduced motion.
- **Magnetic** — `transform .2s ease`, `translateY(-1px)` on hover; `transform:none !important` under reduced motion.

See `05-component-architecture.md` for the full component set.
