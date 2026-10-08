# 10 — Backend Architecture

Go HTTP API, PostgreSQL. Modular but not over-abstracted — a pragmatic layered layout, one interface only where there's a real second implementation (e.g. storage: local vs. S3). The repo path (`go/src/mula`) and Phase-10 guidance fix Go as the backend language.

---

## Module layout

```
api/                      # Go module root (go.mod: module github.com/<org>/mula)
  cmd/
    api/main.go           # HTTP server entrypoint (config, DB, router, serve)
    migrate/main.go       # run migrations
  internal/
    domain/               # entities + business rules, no framework imports
      user/ event/ invitation/ guest/ schedule/ task/ billing/ ...
    application/          # use-cases / services orchestrating domain + repos
    infrastructure/
      postgres/           # repositories (sqlc or pgx), queries
      storage/            # media storage (interface: local | s3)
      mail/               # transactional email (interface: smtp | provider)
      payment/            # provider adapter (webhook verify)
    transport/
      http/
        handler/          # one file per resource; decode→validate→service→encode
        middleware/       # auth, authz(event member), ratelimit, csrf, recover, reqid, cors
        router.go         # route table (mirrors 08)
        dto.go            # request/response DTOs (no domain leakage)
    platform/
      config/ logging/ errors/ validate/
  migrations/             # *.sql (golang-migrate)
  openapi.yaml            # contract → generates frontend client (orval)
  internal/.../*_test.go  # table-driven tests
```

Keep it flat where a domain is small; don't create empty layers for CRUD-only resources.

---

## Key decisions

| Concern | Decision | Rationale |
| --- | --- | --- |
| Router | `chi` (or stdlib `net/http` + `ServeMux` on Go 1.22+ pattern routing) | light, idiomatic; no heavy framework |
| DB access | `pgx` + `sqlc` for typed queries | compile-time-checked SQL, no ORM overhead |
| Migrations | `golang-migrate` SQL files | plain SQL, matches `09` |
| Auth | argon2id password hash; session via signed httpOnly cookie (JWT or opaque session id in `sessions`) | secure default for browser client |
| Authz | middleware resolves event membership+role from path `{eventId}`; handlers declare required role | single choke point, can't be bypassed |
| Validation | `go-playground/validator` or hand rolled, mirroring zod schemas | server is source of truth |
| Config | env vars via `env`/`viper`-free small loader | 12-factor, no secrets in code |
| Logging | `slog` (stdlib) structured, request id per call | observability without deps |
| Errors | central error type → HTTP mapping (`08` envelope) | uniform responses |
| OpenAPI | hand-authored `openapi.yaml` is the contract | frontend `orval` consumes it |

---

## Request lifecycle

```
HTTP → recover → requestID → logging → CORS → ratelimit
     → auth (session cookie/JWT → user)                 [401 if required & missing]
     → authz (load event_member for {eventId}, check role) [404/403]
     → handler: decode + validate DTO
     → application service (domain logic + repos in a tx)
     → encode DTO response / error envelope
```

## Security (enforced here, never frontend)

- **Ownership/IDOR:** `/events/{id}/*` always checks `event_members`. Changing `123`→`124` yields `404` if not a member. Applies to every child resource (guest, task, media, …) via the parent event.
- **Passwords:** argon2id; never logged; reset tokens single-use + expiring.
- **Sessions/tokens:** httpOnly, Secure, SameSite=Lax cookies; short-lived access + refresh, or server sessions with rotation.
- **Input:** validate+sanitize all; parameterized queries (sqlc) → no SQL injection.
- **XSS:** API returns data only; frontend escapes. Invitation `content` JSONB is sanitized on write (allowlist) since it renders publicly.
- **CSRF:** double-submit token for cookie-auth mutations.
- **File upload:** validate MIME+extension+magic bytes+size; store in object storage with random keys; serve via signed URLs; strip EXIF.
- **Rate limiting:** auth, public RSVP/wish, contact — per IP; writes per user.
- **Secrets:** env/secret manager only.
- **Public endpoints** return only published, guest-safe fields (DTO whitelist).

## Observability / ops

- Structured `slog` with request id; health `/healthz`, readiness `/readyz`.
- Metrics (optional) via Prometheus endpoint; defer if not needed.
- Graceful shutdown; DB pool limits; statement timeouts.

## Storage & external

- **Media:** `storage` interface — local dir in dev, S3-compatible in prod. One interface, two impls = justified.
- **Mail:** `mail` interface — SMTP/dev-logger locally, provider in prod.
- **Payments:** `payment` adapter; verify webhook signatures; store only references + status (no card data).

## What is intentionally NOT built

- No GraphQL, no gRPC — REST per `08`.
- No event sourcing, no CQRS.
- No microservices — single deployable binary.
- No ORM.
- Realtime (SSE/websocket) deferred; poll endpoints at launch.
