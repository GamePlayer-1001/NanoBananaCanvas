-- ============================================
--  Nano Banana Canvas — D1 Database Schema
--  Engine: SQLite (Cloudflare D1)
--  Version: 1.0 (M8)
-- ============================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── DB-001: users ────────────────────────────
-- Clerk 用户镜像表，首次登录自动创建
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  clerk_id      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT DEFAULT '',
  plan          TEXT NOT NULL DEFAULT 'free',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── DB-006: categories ──────────────────────
-- 工作流分类（i18n 双语名称）
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name_en       TEXT NOT NULL,
  name_zh       TEXT NOT NULL,
  icon          TEXT DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ── DB-002: workflows ───────────────────────
-- 用户工作流（data 字段存 JSON: {nodes, edges, viewport}）
CREATE TABLE IF NOT EXISTS workflows (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Untitled',
  description   TEXT DEFAULT '',
  data          TEXT NOT NULL DEFAULT '{}',
  thumbnail     TEXT DEFAULT '',
  is_public     INTEGER NOT NULL DEFAULT 0,
  category_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  like_count    INTEGER NOT NULL DEFAULT 0,
  clone_count   INTEGER NOT NULL DEFAULT 0,
  view_count    INTEGER NOT NULL DEFAULT 0,
  published_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_public ON workflows(is_public, published_at);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category_id);

-- ── DB-003: likes ───────────────────────────
-- 点赞（复合主键天然去重）
CREATE TABLE IF NOT EXISTS likes (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id   TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_workflow ON likes(workflow_id);

-- ── DB-003: favorites ───────────────────────
-- 收藏（复合主键天然去重）
CREATE TABLE IF NOT EXISTS favorites (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id   TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_workflow ON favorites(workflow_id);

-- ── DB-004: reports ─────────────────────────
-- 举报记录
CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  reporter_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id   TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  description   TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_workflow ON reports(workflow_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ── DB-005: notifications ───────────────────
-- 站内通知
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT DEFAULT '',
  data          TEXT DEFAULT '{}',
  is_read       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
