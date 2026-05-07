-- Migration: move heavy agent_audit_logs JSON payloads behind R2 pointers

ALTER TABLE agent_audit_logs ADD COLUMN payload_r2_key TEXT;
ALTER TABLE agent_audit_logs ADD COLUMN payload_summary_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE agent_audit_logs ADD COLUMN has_canvas_summary INTEGER NOT NULL DEFAULT 0;
ALTER TABLE agent_audit_logs ADD COLUMN has_plan INTEGER NOT NULL DEFAULT 0;
ALTER TABLE agent_audit_logs ADD COLUMN has_alternatives INTEGER NOT NULL DEFAULT 0;
ALTER TABLE agent_audit_logs ADD COLUMN has_result INTEGER NOT NULL DEFAULT 0;
ALTER TABLE agent_audit_logs ADD COLUMN has_replay_snapshot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE agent_audit_logs ADD COLUMN has_metadata INTEGER NOT NULL DEFAULT 0;
