-- EXPLORE-006: add real category source for published outputs
PRAGMA foreign_keys = OFF;

ALTER TABLE published_output_likes RENAME TO published_output_likes_old;
ALTER TABLE published_output_favorites RENAME TO published_output_favorites_old;
ALTER TABLE published_output_reports RENAME TO published_output_reports_old;
ALTER TABLE published_outputs RENAME TO published_outputs_old;

CREATE TABLE published_outputs (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id             TEXT UNIQUE REFERENCES async_tasks(id) ON DELETE CASCADE,
  workflow_id         TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  category_id         TEXT REFERENCES categories(id) ON DELETE SET NULL,
  source_mode         TEXT NOT NULL DEFAULT 'task' CHECK(source_mode IN ('task', 'import')),
  source_type         TEXT NOT NULL DEFAULT 'native' CHECK(source_type IN ('native', 'civitai', 'manual', 'other')),
  source_author_name  TEXT DEFAULT '',
  source_author_avatar TEXT DEFAULT '',
  import_key          TEXT,
  workflow_json_url   TEXT DEFAULT '',
  title               TEXT NOT NULL DEFAULT 'Untitled Output',
  description         TEXT DEFAULT '',
  prompt              TEXT DEFAULT '',
  source_url          TEXT DEFAULT '',
  thumbnail           TEXT DEFAULT '',
  media_url           TEXT NOT NULL,
  media_type          TEXT NOT NULL CHECK(media_type IN ('image','video')),
  like_count          INTEGER NOT NULL DEFAULT 0,
  clone_count         INTEGER NOT NULL DEFAULT 0,
  view_count          INTEGER NOT NULL DEFAULT 0,
  is_public           INTEGER NOT NULL DEFAULT 1,
  published_at        TEXT NOT NULL DEFAULT (datetime('now')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO published_outputs (
  id, user_id, task_id, workflow_id, category_id, source_mode, source_type,
  source_author_name, source_author_avatar, import_key, workflow_json_url,
  title, description, prompt, source_url, thumbnail, media_url, media_type,
  like_count, clone_count, view_count, is_public, published_at, created_at, updated_at
)
SELECT
  po.id,
  po.user_id,
  po.task_id,
  po.workflow_id,
  w.category_id,
  po.source_mode,
  po.source_type,
  po.source_author_name,
  po.source_author_avatar,
  po.import_key,
  po.workflow_json_url,
  po.title,
  po.description,
  po.prompt,
  po.source_url,
  po.thumbnail,
  po.media_url,
  po.media_type,
  po.like_count,
  po.clone_count,
  po.view_count,
  po.is_public,
  po.published_at,
  po.created_at,
  po.updated_at
FROM published_outputs_old po
LEFT JOIN workflows w ON w.id = po.workflow_id;

CREATE UNIQUE INDEX idx_published_outputs_task_id
  ON published_outputs(task_id)
  WHERE task_id IS NOT NULL;
CREATE UNIQUE INDEX idx_published_outputs_import_key
  ON published_outputs(import_key)
  WHERE import_key IS NOT NULL;
CREATE INDEX idx_published_outputs_user ON published_outputs(user_id, created_at DESC);
CREATE INDEX idx_published_outputs_public ON published_outputs(is_public, published_at DESC);
CREATE INDEX idx_published_outputs_workflow ON published_outputs(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX idx_published_outputs_category ON published_outputs(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_published_outputs_source_mode ON published_outputs(source_mode, source_type, published_at DESC);

CREATE TABLE published_output_likes (
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_output_id TEXT NOT NULL REFERENCES published_outputs(id) ON DELETE CASCADE,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, published_output_id)
);

INSERT INTO published_output_likes (user_id, published_output_id, created_at)
SELECT user_id, published_output_id, created_at
FROM published_output_likes_old;

CREATE INDEX idx_published_output_likes_output ON published_output_likes(published_output_id);

CREATE TABLE published_output_favorites (
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_output_id TEXT NOT NULL REFERENCES published_outputs(id) ON DELETE CASCADE,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, published_output_id)
);

INSERT INTO published_output_favorites (user_id, published_output_id, created_at)
SELECT user_id, published_output_id, created_at
FROM published_output_favorites_old;

CREATE INDEX idx_published_output_favorites_output ON published_output_favorites(published_output_id);

CREATE TABLE published_output_reports (
  id                  TEXT PRIMARY KEY,
  reporter_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_output_id TEXT NOT NULL REFERENCES published_outputs(id) ON DELETE CASCADE,
  reason              TEXT NOT NULL,
  description         TEXT DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO published_output_reports (id, reporter_id, published_output_id, reason, description, status, created_at)
SELECT id, reporter_id, published_output_id, reason, description, status, created_at
FROM published_output_reports_old;

CREATE INDEX idx_published_output_reports_output ON published_output_reports(published_output_id);
CREATE INDEX idx_published_output_reports_status ON published_output_reports(status);

DROP TABLE published_output_likes_old;
DROP TABLE published_output_favorites_old;
DROP TABLE published_output_reports_old;
DROP TABLE published_outputs_old;

PRAGMA foreign_keys = ON;
