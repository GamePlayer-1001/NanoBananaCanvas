-- Migration: agent_audit_logs
-- Run this on existing D1 databases to add persistent Agent co-creation audit logs

CREATE TABLE IF NOT EXISTS agent_audit_logs (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id       TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  mode              TEXT,
  user_message      TEXT,
  canvas_summary    TEXT,
  plan_json         TEXT,
  alternatives_json TEXT,
  result_json       TEXT,
  replay_snapshot   TEXT,
  target_node_id    TEXT,
  proposal_id       TEXT,
  confirmed         INTEGER NOT NULL DEFAULT 0,
  metadata_json     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_workflow
  ON agent_audit_logs(workflow_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_audit_event
  ON agent_audit_logs(user_id, event_type, created_at DESC);
