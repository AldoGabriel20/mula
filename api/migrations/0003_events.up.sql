-- Events + membership (docs/09). event_members is the authorization backbone.
CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES users(id),
  type         text NOT NULL,
  couple_a     text,
  couple_b     text,
  event_date   timestamptz,
  venue        text,
  status       text NOT NULL DEFAULT 'draft', -- draft | published
  public_token text UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX idx_events_owner ON events(owner_id);

CREATE TABLE event_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE, -- null until invite accepted
  email       citext NOT NULL,
  role        text NOT NULL, -- owner | cohost | planner | family | usher
  invited_at  timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
CREATE UNIQUE INDEX uq_event_members_user ON event_members(event_id, user_id);
CREATE UNIQUE INDEX uq_event_members_email ON event_members(event_id, email);
CREATE INDEX idx_event_members_user ON event_members(user_id);
