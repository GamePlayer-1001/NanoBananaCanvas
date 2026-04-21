-- ============================================
--  M10: categories 多语言真相源收口
-- ============================================
--
-- 目的:
-- 1. 为 categories 增加 name_i18n JSON 列，承载可扩展多语言结构
-- 2. 用历史 name_en / name_zh 回填 JSON，保持线上数据平滑升级
--
-- 注意:
-- SQLite/D1 的 ADD COLUMN 为一次性迁移，不可重复执行。

ALTER TABLE categories ADD COLUMN name_i18n TEXT NOT NULL DEFAULT '{}';

UPDATE categories
SET name_i18n = json_object(
  'en', COALESCE(NULLIF(name_en, ''), slug),
  'zh', COALESCE(NULLIF(name_zh, ''), COALESCE(NULLIF(name_en, ''), slug))
)
WHERE TRIM(COALESCE(name_i18n, '')) IN ('', '{}');
