-- ============================================
--  MIGRATION-026: async_tasks 失败诊断持久化
--  为 provider fallback / 主链失败补充结构化诊断字段
-- ============================================

ALTER TABLE async_tasks ADD COLUMN diagnostics_data TEXT;
