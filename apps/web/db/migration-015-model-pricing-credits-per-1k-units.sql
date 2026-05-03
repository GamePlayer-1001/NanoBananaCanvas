-- ============================================
--  Migration 015 — model_pricing credits_per_1k_units backfill
--  目标:
--  1. 兼容历史生产库仍停留在 credits_per_call 的旧结构
--  2. 为运行时代码补齐 credits_per_1k_units 新字段
--  3. 用旧 credits_per_call 数值回填，保证最小行为一致
-- ============================================

ALTER TABLE model_pricing ADD COLUMN credits_per_1k_units INTEGER;

UPDATE model_pricing
SET credits_per_1k_units = COALESCE(credits_per_1k_units, credits_per_call, 0)
WHERE credits_per_1k_units IS NULL;

