-- Users & auth (docs/09). citext for case-insensitive email uniqueness.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext UNIQUE NOT NULL,
  password_hash     text NOT NULL,
  name              text NOT NULL,
  avatar_url        text,
  email_verified_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

CREATE TABLE user_preferences (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  locale        text NOT NULL DEFAULT 'en',
  theme         text NOT NULL DEFAULT 'system',
  notifications jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE verification_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);

CREATE TABLE password_reset_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

CREATE TABLE sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  user_agent text,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
