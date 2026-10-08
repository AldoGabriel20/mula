# Mula

Digital invitations. Go API (`api/`) + Next.js app (`web/`) + Postgres. Design/spec docs live in `docs/`.

## Quick start

Requires Docker, Go 1.25+, Node 20+.

```bash
make setup      # .env + Postgres (docker) + migrations + demo data
make api        # terminal 1 → http://localhost:8080
make web        # terminal 2 → http://localhost:3000  (proxies /api/v1 to the API)
```

`make setup` prints a demo login and each demo guest's personal invitation link:

| | |
|---|---|
| email | `demo@mula.test` |
| password | `demo-password-1` |

Open `http://localhost:3000/login`, or a printed `/invite/<token>` link as a guest.

## Common tasks

| | |
|---|---|
| `make test` | Go unit + integration tests (own `mula_test` DB; they truncate tables) |
| `make seed` | Re-run the demo seed (idempotent; refuses unless `APP_ENV=dev`) |
| `make db-reset` | **Destroys** the dev database volume and rebuilds it |
| `cd web && npm run typecheck && npm run lint && npm test` | Frontend checks (unit + component) |
| `cd web && E2E_FULL_STACK=1 npx playwright test` | End-to-end, responsive and accessibility specs (needs `make api`, Postgres, and the web build; see below) |

The dev database runs as the isolated compose project `mula-dev` on `127.0.0.1:15432`
(throwaway password) and never touches other compose projects on your machine.

## Configuration

See `.env.example` — every variable listed is read by the code. Outside `APP_ENV=dev` the API
refuses to start without `PAYMENT_WEBHOOK_SECRET` and `MEDIA_SIGNING_SECRET`
(generate with `openssl rand -hex 32`).

## Layout

```
api/   Go: cmd/{api,migrate,seed}, internal/{domain,application,infrastructure,transport,platform}, migrations/
web/   Next.js 14 (App Router): (marketing) (auth) app/ invite/[token]
docs/  Product + architecture spec and the implementation plan
```

## Testing

- **Go** (`make test`): domain/unit tests plus HTTP integration tests against a real Postgres.
  `authz_matrix_test.go` checks **every** event-scoped route as anonymous, stranger and each of the
  five roles, and fails if a route is added to `router.go` without a declared authorization tier.
- **Web** (`npm test`): vitest + Testing Library (validation, API client, `.ics`, UI primitives, widgets).
- **End-to-end** (`web/tests/e2e`): Playwright on desktop/tablet/mobile + axe accessibility.
  Specs that need the API are skipped unless `E2E_FULL_STACK=1`. Test users are created by
  `go run ./cmd/seed e2e-user <email> [--with-event]` (dev only) — there is no test-only HTTP endpoint.
- **CI** (`.github/workflows/ci.yml`): api, web, e2e (needs both), and an advisory contract-drift job.
  The web jobs need a committed `web/package-lock.json`.
