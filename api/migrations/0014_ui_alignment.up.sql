-- 0014 — fields and tables the latest dashboard UI needs (docs/api-change-plan.md). All additive.

-- schedule: the "Edit moment" form
ALTER TABLE schedule_items
  ADD COLUMN ends_at     timestamptz,
  ADD COLUMN address     text NOT NULL DEFAULT '',
  ADD COLUMN dress_code  text NOT NULL DEFAULT '',
  ADD COLUMN description text NOT NULL DEFAULT '',
  ADD COLUMN visibility  text NOT NULL DEFAULT 'everyone',
  ADD CONSTRAINT chk_schedule_visibility CHECK (visibility IN ('everyone','invite_only','family_only')),
  ADD CONSTRAINT chk_schedule_range CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at);

-- guests: seating label, host notes, when the invitation was last sent
ALTER TABLE guests
  ADD COLUMN table_label text,
  ADD COLUMN notes       text NOT NULL DEFAULT '',
  ADD COLUMN invited_at  timestamptz;

-- tasks: category chips
ALTER TABLE tasks ADD COLUMN category text NOT NULL DEFAULT '';

-- registry: quantity wanted / already gifted
ALTER TABLE gifts
  ADD COLUMN quantity int NOT NULL DEFAULT 1,
  ADD COLUMN claimed  int NOT NULL DEFAULT 0,
  ADD CONSTRAINT chk_gift_quantity CHECK (quantity >= 1),
  ADD CONSTRAINT chk_gift_claimed CHECK (claimed >= 0 AND claimed <= quantity);

-- live stream: start time + whether guests see it
ALTER TABLE live_config
  ADD COLUMN starts_at           timestamptz,
  ADD COLUMN show_on_invitation  boolean NOT NULL DEFAULT true;

-- profile phone
ALTER TABLE users ADD COLUMN phone text;

-- explicit RSVP deadline (NULL = the event-day cut-off in domain/invitation)
ALTER TABLE invitations ADD COLUMN rsvp_deadline timestamptz;

-- "Ways to give": bank account / e-wallet / physical gift
CREATE TABLE gift_methods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('bank','wallet','physical')),
  title      text NOT NULL,
  detail     text NOT NULL DEFAULT '',
  copy_value text NOT NULL DEFAULT '',
  position   int  NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gift_methods_event ON gift_methods(event_id, position);

-- design catalog (invitations.template_id referenced it with no table)
CREATE TABLE templates (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug     text UNIQUE NOT NULL,
  name     text NOT NULL,
  category text NOT NULL,
  tags     text NOT NULL DEFAULT '',
  palette  text NOT NULL DEFAULT '',
  position int  NOT NULL,
  active   boolean NOT NULL DEFAULT true
);
INSERT INTO templates (slug, name, category, tags, palette, position) VALUES
  ('linen-vow',     'Linen Vow',     'Wedding',        'Minimal · Warm',      'Ivory',    0),
  ('golden-hour',   'Golden Hour',   'Anniversary',    'Elegant · Dark',      'Midnight', 1),
  ('seventeen',     'Seventeen',     '17th Birthday',  'Modern · Bold',       'Stone',    2),
  ('paper-margin',  'Paper Margin',  'Editorial',      'Editorial · Serif',   'Ivory',    3),
  ('first-light',   'First Light',   'Birthday',       'Warm · Playful',      'Blush',    4),
  ('signal',        'Signal',        'Product Launch', 'Modern · Mono',       'Midnight', 5),
  ('quiet-ring',    'Quiet Ring',    'Wedding',        'Elegant · Botanical', 'Forest',   6),
  ('studio-night',  'Studio Night',  'Brand',          'Brand · Dark',        'Midnight', 7);
ALTER TABLE invitations ADD CONSTRAINT fk_invitations_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;

-- purchased add-ons (settled by the same signed webhook as packages)
CREATE TABLE user_addons (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addon_id     uuid NOT NULL REFERENCES addons(id),
  provider_ref text NOT NULL,
  status       text NOT NULL, -- pending | active | failed
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_addons_user ON user_addons(user_id);
CREATE INDEX idx_user_addons_ref  ON user_addons(provider_ref);
