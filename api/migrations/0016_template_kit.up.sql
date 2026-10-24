-- 0016 — Template Kit (docs/17-template-kit-design.md §9.1). All additive.
-- The manifest column is filled by `go run ./cmd/templates sync` from catalog/templates/*/manifest.json.

ALTER TABLE templates
  ADD COLUMN kind       text        NOT NULL DEFAULT 'coded'     CHECK (kind IN ('coded','themed')),
  ADD COLUMN status     text        NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','retired')),
  ADD COLUMN access     text        NOT NULL DEFAULT 'free'      CHECK (access IN ('free','premium')),
  ADD COLUMN version    int         NOT NULL DEFAULT 1,
  ADD COLUMN manifest   jsonb       NOT NULL DEFAULT '{}',
  -- NULL = platform template. Nothing writes it before phase 4, which adds the FK to users(id) ON DELETE CASCADE;
  -- without it now, the integration tests' TRUNCATE users CASCADE cannot wipe the shared catalog.
  ADD COLUMN owner_id   uuid        NULL,
  ADD COLUMN parent_id  uuid        NULL REFERENCES templates(id) ON DELETE SET NULL,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX idx_templates_owner ON templates(owner_id) WHERE owner_id IS NOT NULL;

ALTER TABLE invitations
  ADD COLUMN theme jsonb NOT NULL DEFAULT '{}'; -- {palette?, fontPairing?, motion?, tokens?:{role:#hex}}
