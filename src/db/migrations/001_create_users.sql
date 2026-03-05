-- 001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  email        VARCHAR(255) UNIQUE,
  password_hash TEXT,
  role         VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  provider     VARCHAR(20),
  provider_id  VARCHAR(100),
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_provider_idx ON users (provider, provider_id)
  WHERE provider IS NOT NULL AND provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)
  WHERE email IS NOT NULL;
