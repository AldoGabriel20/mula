# 14 — Testing Strategy

Tooling from the recovered stack: **vitest** + Testing Library (unit/component), **playwright** (e2e) on the frontend; Go **table-driven tests** + `httptest` + a Postgres test DB on the backend. CI runs lint, typecheck, unit/component, API, and a critical-path e2e suite; `orval --check` gates the client against the contract.

Testing follows the ponytail rule: one runnable check per piece of non-trivial logic; no fixture sprawl, no per-function suites unless the logic warrants it. Prioritize the money/security/critical-flow paths.

---

## Layers

### Unit
- **Frontend:** zod schemas (`lib/validation`), utilities (`.ics` generation, segment/readiness client helpers, error-envelope parsing, date/format), motion gating (reduced-motion/pointer logic).
- **Backend:** domain rules (readiness computation, segment classification, publish preconditions, role→permission matrix, password hashing wrappers, token expiry).

### Component (vitest + Testing Library)
- UI primitives (`Button/Input/Modal/Chip/Skeleton/EmptyState/ErrorState`) — variants, a11y (roles, focus, ESC/overlay close), both themes.
- `ArchMeter` value mapping, `Reveal/Magnetic/Tilt` respect reduced-motion.
- Forms (`LoginForm`, `RsvpForm`, `GuestEditor`) — validation, error binding, submit calls mocked mutation.
- Stateful widgets (`TaskList` toggle+counter, `GuestTable` sort/select, `InvitationEditor` reorder) with mocked React Query.

### Integration / API (Go)
- Each handler against a real Postgres test DB (migrations applied): success + validation + authz.
- **Authorization matrix:** for every `/events/{id}/*` resource, a non-member and each role asserted (IDOR: foreign id → 404; insufficient role → 403).
- Auth flows: register, verify, login (cookie+CSRF), reset (single-use token), rate limiting (429).
- Publish: draft→published mints token; unpublish revokes; missing required sections → 422.
- Public invite: token read returns only guest-safe fields; RSVP/wish token-scoped; unpublished/foreign token → 404.
- Payment webhook signature verification; subscription state transitions.

### End-to-end (playwright)
Minimum critical flows (required green in CI):
```
Register
Login
Logout
Create Invitation (onboarding)
Update Invitation (design editor)
Save Invitation
Preview Invitation (host)
Publish Invitation
Open Public Invitation (/invite/[token])
Guest RSVP
Unauthorized Access (visit /app/* logged out → redirect to /login)
Invalid Resource (foreign /events/{id} → 404/redirect)
```
Run against a seeded test environment (INT-001 seed). Chromium in CI; add mobile viewport project for responsive-critical pages.

### Responsive tests
Playwright projects at desktop (1280), tablet (768), mobile (375) for: marketing hero, dashboard shell (sidebar→mobile nav), guest table, invitation preview, public invitation. Assert layout/visibility per `11`/responsive requirement — mobile is an intentional layout, not scaled desktop.

### Visual regression (optional, recommended)
Playwright screenshot snapshots for high-fidelity surfaces: marketing hero, overview (readiness arch), public invitation — both themes. Baselines reviewed on change. Mask the animated 3D canvas / grain to avoid flaky diffs (test their presence separately).

### Accessibility
`@axe-core/playwright` on key pages (marketing, auth, overview, design, public invitation); no critical violations. Keyboard nav + focus-visible ring verified; reduced-motion path rendered.

---

## Coverage priorities (highest first)
1. Authorization / IDOR on all event-scoped resources (security).
2. Auth flows + session/CSRF.
3. Publish + public invitation + RSVP (core product + guest-facing).
4. Payments/webhooks (money path).
5. Computed logic (readiness, segments, journey).
6. Editor mutations (reorder/visibility/optimistic rollback).
7. Responsive + visual fidelity of signature surfaces.

## CI gates
- `lint`, `typecheck`, `test` (vitest), `go test ./...`, `orval --check`, critical-path `test:e2e`.
- Fail build on: type errors, failing tests, stale generated client, new critical a11y violations.
- Secrets provided via CI env; ephemeral Postgres service container for API/e2e.

## Non-goals (YAGNI)
- No 100% coverage mandate; cover logic that breaks silently, skip trivial passthroughs.
- No load/stress testing at launch (add when scale is real).
- No cross-browser matrix beyond Chromium initially (add WebKit/Firefox if the audience needs it).
