# 04 — Motion & Interaction Specification

**High priority.** The prototypes' character lives in their motion. Reproduce these effects, don't substitute generic fades. Every effect is gated by `prefers-reduced-motion: reduce` and pointer-fine detection in the source; preserve that.

Source: `mula-fx.js` (shared motion layer), `mula-3d.js` (three.js invitation object), prototype CSS keyframes.

Global rules from source:
- `reduce = matchMedia('(prefers-reduced-motion: reduce)').matches` — disables grain, tilt, magnetic, reveal transitions.
- `fine = pointer:fine && hover:hover && not touch` — custom cursor and magnetic/tilt only on fine pointers.
- Base fx easing: `cubic-bezier(.2,.75,.15,1)`. Entrance easing token `--eo cubic-bezier(.16,1,.3,1)`; spring `--sp cubic-bezier(.34,1.56,.64,1)`.
- Focus ring always visible: `2px solid #C9A56E`, offset `3px`.

---

## Motion layer (`mula-fx.js`) — declarative hooks

The layer scans the DOM for data attributes. Production keeps the same contract (as React hooks/components wrapping framer-motion + IntersectionObserver).

| Attribute | Behaviour |
| --- | --- |
| `data-reveal` | Scroll-reveal: element enters from hidden → visible when it crosses the viewport (IntersectionObserver). |
| `data-reveal-wait` | Delays reveal (stagger / sequence). |
| `data-magnetic` (+ `.mula-mag-on`) | Magnetic hover: element tracks cursor slightly; `transform .2s ease`, `translateY(-1px)` baseline. |
| `data-tilt` (+ `.mula-tilt-on`) | 3D tilt toward cursor on `mousemove`. |
| `data-bg` | Section colour grading: background grades as the section scrolls into view. |
| `img[src^="assets/"]` | Progressive image handling (load/fade-in). |

Listeners: `scroll`, `resize`, `mousemove`, `mouseenter/leave/over`, `click`, `pageshow` (bfcache restore). The film grain is a fixed full-viewport SVG `feTurbulence` overlay, `mix-blend-mode: overlay`, `opacity .075`, animated `mulaGrain .9s steps(4) infinite`.

### Effect catalogue

#### Film grain
```
Component: whole-page overlay (.mula-fx-grain)
Trigger: always (page load)
Animation: translate jitter, steps(4), .9s infinite
Mobile: present but cheap (single fixed SVG); honor reduced-motion (animation:none)
Performance: one GPU-composited fixed layer; no per-frame JS
```

#### Custom cursor
```
Component: body (.mula-fx-cursor)
Trigger: fine pointer only
Behaviour: hides native cursor; text inputs keep text cursor
Mobile/touch: disabled entirely
```

#### Scroll reveal
```
Component: [data-reveal] (+ -wait for stagger)
Trigger: IntersectionObserver entry
Initial: opacity 0, translateY
Animation: fade + rise, easing --eo, ~400–600ms
Mobile: enabled, lighter distance
Reduced motion: appear instantly
```

#### Magnetic buttons
```
Component: [data-magnetic]
Trigger: mousemove within hover region (fine pointer)
Transform: translate toward cursor, spring back on leave
Duration: .2s ease
Mobile/reduced: transform:none !important
```

#### Tilt
```
Component: [data-tilt]
Trigger: mousemove (fine pointer)
Transform: rotateX/rotateY toward cursor, perspective parent
Reduced/touch: disabled
```

#### Section colour grading
```
Component: [data-bg] sections
Trigger: scroll position
Behaviour: background token crossfades between sections
Performance: CSS variable / background transition, no layout
```

#### Page transitions
```
Trigger: internal navigation / pageshow
Behaviour: cross-page fade/slide; restores correctly from bfcache (pageshow handler)
Production: App Router + framer-motion AnimatePresence on a shared template
```

#### Skeleton shimmer
```
Component: loading placeholders (ds_skeleton)
Animation: ds_shimmer 1.2s linear infinite (200% → -200% background-position)
Reduced motion: animation:none
```

---

## 3D invitation object (`mula-3d.js`, three.js)

API: `mountInvitation(canvas, { mode:'hero'|'float', layout(w,h)=>{x,y,s,rot}, onPhase(name) })`.

- A paper invitation card mesh, dimensions `PW 1.9 × PH 2.7 × PD 0.018`.
- Textures generated procedurally at `1024×(1024·PH/PW)`: colour, ORM, bump, mask canvases. Paper-fibre noise added to colour (amt 7) and bump (amt 22). Gold-foil linear gradient for foil regions.
- **Modes:** `hero` (large, foreground, interactive in the hero) and `float` (ambient, smaller, decorative elsewhere).
- **`layout(w,h)`** lets the page position/scale/rotate the card responsively.
- **`onPhase(name)`** fires as the open animation advances (cover → opening → open), letting the page sync copy/UI to the card state.
- Driven by `requestAnimationFrame`; mounted/paused via `IntersectionObserver` (don't render offscreen).
- Custom easing in-file (`ease`, `span`, `clamp`) for the open sequence.

### Production implementation decision

| Concern | Decision |
| --- | --- |
| Library | Keep **three.js** (`three@0.186` already in deps, `@types/three` present). The foil + paper material and the opening animation are not reproducible in CSS 3D at fidelity. |
| Loading | **Lazy-load** three.js and the invitation module via dynamic `import()`; render a static poster image (`shots/*.jpg`) until loaded and on reduced-motion / low-power. |
| Mount control | IntersectionObserver gates rAF; pause when offscreen or tab hidden. |
| Mobile | Serve the `float`/poster variant or a static image; skip the heavy hero render on small/low-power devices. |
| Fallback | `prefers-reduced-motion` or no WebGL → static poster image, no canvas. |

Other 3D/visual effects (tilt, grading, grain) are **CSS/Canvas**, not WebGL — keep them light.

---

## Per-breakpoint motion policy

| Effect | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| 3D hero | full interactive | reduced / float | poster image |
| Custom cursor | on | off | off |
| Magnetic / tilt | on | off | off |
| Scroll reveal | on | on | on (shorter) |
| Grain | on | on | on (or off on low-power) |
| Section grading | on | on | on |

Always provide the reduced-motion static experience.
