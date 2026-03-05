-- 002_create_posts.sql
CREATE TABLE IF NOT EXISTS posts (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL UNIQUE,
  content      JSONB NOT NULL DEFAULT '{}',
  content_html TEXT,
  excerpt      TEXT,
  cover_image  TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published', 'archived')),
  author_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  views        INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_slug_idx        ON posts (slug);
CREATE INDEX IF NOT EXISTS posts_status_idx      ON posts (status);
CREATE INDEX IF NOT EXISTS posts_author_idx      ON posts (author_id);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC)
  WHERE status = 'published';

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
