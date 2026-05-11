-- EXPLORE-001: published outputs
CREATE TABLE IF NOT EXISTS published_outputs (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id           TEXT NOT NULL UNIQUE REFERENCES async_tasks(id) ON DELETE CASCADE,
  workflow_id       TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  title             TEXT NOT NULL DEFAULT 'Untitled Output',
  description       TEXT DEFAULT '',
  prompt            TEXT DEFAULT '',
  source_url        TEXT DEFAULT '',
  thumbnail         TEXT DEFAULT '',
  media_url         TEXT NOT NULL,
  media_type        TEXT NOT NULL CHECK(media_type IN ('image','video')),
  like_count        INTEGER NOT NULL DEFAULT 0,
  clone_count       INTEGER NOT NULL DEFAULT 0,
  view_count        INTEGER NOT NULL DEFAULT 0,
  is_public         INTEGER NOT NULL DEFAULT 1,
  published_at      TEXT NOT NULL DEFAULT (datetime('now')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_published_outputs_user ON published_outputs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_outputs_public ON published_outputs(is_public, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_outputs_workflow ON published_outputs(workflow_id) WHERE workflow_id IS NOT NULL;

-- EXPLORE-002: likes/favorites/reports for published outputs
CREATE TABLE IF NOT EXISTS published_output_likes (
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_output_id TEXT NOT NULL REFERENCES published_outputs(id) ON DELETE CASCADE,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, published_output_id)
);

CREATE INDEX IF NOT EXISTS idx_published_output_likes_output ON published_output_likes(published_output_id);

CREATE TABLE IF NOT EXISTS published_output_favorites (
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_output_id TEXT NOT NULL REFERENCES published_outputs(id) ON DELETE CASCADE,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, published_output_id)
);

CREATE INDEX IF NOT EXISTS idx_published_output_favorites_output ON published_output_favorites(published_output_id);

CREATE TABLE IF NOT EXISTS published_output_reports (
  id                  TEXT PRIMARY KEY,
  reporter_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_output_id TEXT NOT NULL REFERENCES published_outputs(id) ON DELETE CASCADE,
  reason              TEXT NOT NULL,
  description         TEXT DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_published_output_reports_output ON published_output_reports(published_output_id);
CREATE INDEX IF NOT EXISTS idx_published_output_reports_status ON published_output_reports(status);
