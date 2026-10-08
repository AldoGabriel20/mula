-- Gifts, transactions (read; sourced from payment webhooks later), wishes, media (docs/09).
CREATE TABLE gifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  target_amount numeric,
  url           text,
  position      int NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gifts_event ON gifts(event_id, position);

CREATE TABLE transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  gift_id      uuid REFERENCES gifts(id) ON DELETE SET NULL,
  provider_ref text NOT NULL,
  amount       numeric NOT NULL,
  currency     text NOT NULL DEFAULT 'IDR',
  from_name    text NOT NULL DEFAULT '',
  status       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_event ON transactions(event_id, created_at DESC);

CREATE TABLE wishes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id    uuid REFERENCES guests(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  message     text NOT NULL,
  phase       text NOT NULL DEFAULT 'pre', -- pre | post
  approved    boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wishes_event ON wishes(event_id, created_at DESC);

CREATE TABLE media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  kind         text NOT NULL, -- image | photo | cover
  storage_key  text NOT NULL,
  url          text NOT NULL,
  content_type text NOT NULL,
  size_bytes   bigint NOT NULL,
  meta         jsonb NOT NULL DEFAULT '{}',
  uploaded_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_event ON media(event_id, created_at DESC);
