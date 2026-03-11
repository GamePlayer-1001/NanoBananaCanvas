-- Migration: ADV-003 execution_history
-- Run this on existing D1 databases to add execution history tracking

CREATE TABLE IF NOT EXISTS execution_history (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id     TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK(status IN ('success','failed','aborted')),
  node_count      INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER,
  error_message   TEXT,
  summary         TEXT DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exec_history_workflow ON execution_history(workflow_id, created_at DESC);
