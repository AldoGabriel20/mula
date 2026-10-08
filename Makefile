# Local development shortcuts. Requires: docker, go 1.25+, node 20+.
# Config comes from .env (copy .env.example). `make setup` does everything for a fresh checkout.

SHELL := /bin/bash
ENV   := set -a; [ -f .env ] && . ./.env; set +a;

.PHONY: setup db db-down db-reset migrate seed api web test help

help:
	@echo "make setup    first run: .env + db + migrate + seed"
	@echo "make db       start Postgres (docker, localhost:15432)"
	@echo "make migrate  apply SQL migrations"
	@echo "make seed     load the demo account + celebration (dev only, idempotent)"
	@echo "make api      run the Go API on :8080"
	@echo "make web      run the Next dev server on :3000"
	@echo "make test     Go unit + integration tests (uses TEST_DATABASE_URL)"
	@echo "make db-reset DESTROY the dev database volume and start over"

.env:
	cp .env.example .env
	@echo "created .env from .env.example"

setup: .env db migrate seed
	@echo; echo "Ready. In two terminals: 'make api' and 'make web', then open http://localhost:3000"

db:
	docker compose up -d --wait postgres

db-down:
	docker compose down          # keeps data (named volume)

# Only touches the mula-dev compose project's own volume (see docker-compose.yml `name:`).
db-reset:
	docker compose down -v
	$(MAKE) db migrate seed

migrate:
	$(ENV) cd api && go run ./cmd/migrate up

seed:
	$(ENV) cd api && go run ./cmd/seed

api:
	$(ENV) cd api && go run ./cmd/api

web:
	$(ENV) cd web && npm run dev

# Integration tests TRUNCATE users CASCADE, so they get their own database.
test:
	docker compose exec -T postgres psql -U mula -d mula -tc "SELECT 1 FROM pg_database WHERE datname='mula_test'" | grep -q 1 \
	  || docker compose exec -T postgres psql -U mula -d mula -c "CREATE DATABASE mula_test"
	$(ENV) cd api && DATABASE_URL="$$TEST_DATABASE_URL" go run ./cmd/migrate up && go test -count=1 ./...
