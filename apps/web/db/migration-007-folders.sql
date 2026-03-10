-- ============================================
--  Migration 007: folders — 工作区文件夹
--  用户级组织单位，用于工作流项目分组管理
-- ============================================

-- ── DB-007: folders ───────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'New Folder',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id, sort_order);

-- workflows 表添加 folder_id（可选外键，删除文件夹时置 NULL）
ALTER TABLE workflows ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_folder ON workflows(folder_id);
