-- Billing: catalog, subscriptions, invoices (docs/09). Only references + status are
-- stored; the payment provider holds card/payment data.
CREATE TABLE packages (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug     text UNIQUE NOT NULL,
  name     text NOT NULL,
  price    numeric NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  features jsonb NOT NULL DEFAULT '[]',
  active   boolean NOT NULL DEFAULT true
);

CREATE TABLE addons (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug     text UNIQUE NOT NULL,
  name     text NOT NULL,
  price    numeric NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  features jsonb NOT NULL DEFAULT '[]',
  active   boolean NOT NULL DEFAULT true
);

CREATE TABLE subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id         uuid NOT NULL REFERENCES packages(id),
  provider_ref       text NOT NULL,
  status             text NOT NULL, -- pending | active | canceled
  current_period_end timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
-- provider_ref identifies the checkout; webhook idempotency/lookup key.
CREATE UNIQUE INDEX uq_subscriptions_ref ON subscriptions(provider_ref);

CREATE TABLE invoices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_ref text NOT NULL,
  description  text NOT NULL DEFAULT '',
  amount       numeric NOT NULL,
  currency     text NOT NULL DEFAULT 'IDR',
  status       text NOT NULL, -- pending | paid | failed
  issued_at    timestamptz NOT NULL DEFAULT now(),
  pdf_url      text
);
CREATE INDEX idx_invoices_user ON invoices(user_id, issued_at DESC);
CREATE UNIQUE INDEX uq_invoices_ref ON invoices(provider_ref);

-- seed catalog (prices are placeholders, matching the marketing pricing page)
INSERT INTO packages (slug, name, price, features) VALUES
  ('essential', 'Essential', 149000, '["Essential template selection","RSVP","Single share link"]'),
  ('signature', 'Signature', 349000, '["Full template collection","Personalized guest links","Guest management","WhatsApp sharing"]');
INSERT INTO addons (slug, name, price, features) VALUES
  ('live-stream', 'Live streaming', 129000, '["Stream your event to remote guests"]'),
  ('gallery', 'Memories gallery', 79000, '["Guest photo gallery and wishes"]');
