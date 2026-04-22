-- ============================================
--  Migration 012 — Billing Metering Columns
--  目标:
--  1. 为 ai_usage_logs 补齐 billable_units / estimated_credits
--  2. 让文本/图片/视频/音频 usage 统计都能持久化统一计量语义
-- ============================================

ALTER TABLE ai_usage_logs ADD COLUMN billable_units INTEGER;
ALTER TABLE ai_usage_logs ADD COLUMN estimated_credits INTEGER;
