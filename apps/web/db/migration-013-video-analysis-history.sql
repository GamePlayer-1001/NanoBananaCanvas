-- Migration: video_analysis_history
-- 用户级视频分析历史持久化

CREATE TABLE IF NOT EXISTS video_analysis_history (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_size         INTEGER NOT NULL DEFAULT 0,
  mime_type         TEXT NOT NULL DEFAULT '',
  duration_seconds  REAL NOT NULL DEFAULT 0,
  model_id          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'processing'
                    CHECK(status IN ('processing','completed','failed')),
  error_message     TEXT,
  result_json       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_video_analysis_history_user
  ON video_analysis_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_analysis_history_active
  ON video_analysis_history(user_id, status, created_at DESC);
