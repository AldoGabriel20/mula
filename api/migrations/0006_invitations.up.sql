-- Invitation + sections (docs/09). 1:1 with event. template_id has no FK yet
-- (templates catalog is a later task); it stays a nullable uuid reference.
CREATE TABLE invitations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_id      uuid,
  palette          text NOT NULL DEFAULT '',
  content_language text NOT NULL DEFAULT 'en',
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invitation_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  type          text NOT NULL, -- hero | story | schedule | gift | rsvp | ...
  position      int NOT NULL,
  visible       boolean NOT NULL DEFAULT true,
  content       jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invitation_sections_pos ON invitation_sections(invitation_id, position);
