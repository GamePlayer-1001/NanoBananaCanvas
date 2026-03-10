-- ============================================
--  Nano Banana Canvas — D1 Database Schema
--  Engine: SQLite (Cloudflare D1)
--  Version: 2.2 (M8 + M7 + folders 工作区文件夹)
-- ============================================

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
  folder_id     TEXT REFERENCES folders(id) ON DELETE SET NULL,
  published_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_public ON workflows(is_public, published_at);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_workflows_folder ON workflows(folder_id);

-- ── DB-007: folders ────────────────────────────
-- 工作区文件夹（用户级组织单位，项目分组管理）
CREATE TABLE IF NOT EXISTS folders (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'New Folder',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id, sort_order);

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

-- ============================================
--  M7: 积分 / 支付 / AI 执行
-- ============================================

-- ── CREDIT-001: credit_balances ───────────────
-- 三池余额 (monthly 月度订阅 / permanent 永久 / frozen 冻结中)
CREATE TABLE IF NOT EXISTS credit_balances (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_balance   INTEGER NOT NULL DEFAULT 200,
  permanent_balance INTEGER NOT NULL DEFAULT 0,
  frozen            INTEGER NOT NULL DEFAULT 0,
  total_earned      INTEGER NOT NULL DEFAULT 200,
  total_spent       INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── CREDIT-002: credit_transactions ───────────
-- 积分审计日志 (不可变，只追加)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK(type IN ('earn','spend','freeze','unfreeze','refund')),
  pool              TEXT NOT NULL DEFAULT 'permanent' CHECK(pool IN ('monthly','permanent')),
  amount            INTEGER NOT NULL,
  balance_after     INTEGER NOT NULL,
  source            TEXT NOT NULL,
  reference_id      TEXT,
  description       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_tx_ref ON credit_transactions(reference_id);

-- ── CREDIT-003: subscriptions ─────────────────
-- Stripe 订阅记录 (每用户最多一条有效)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id    TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro')),
  billing_period        TEXT DEFAULT 'monthly' CHECK(billing_period IN ('weekly','monthly','yearly')),
  status                TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','canceled','past_due','trialing')),
  current_period_start  TEXT,
  current_period_end    TEXT,
  monthly_credits       INTEGER NOT NULL DEFAULT 200,
  cancel_at_period_end  INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ── CREDIT-004: model_pricing ─────────────────
-- 模型定价表 (积分/次)
CREATE TABLE IF NOT EXISTS model_pricing (
  id                TEXT PRIMARY KEY,
  provider          TEXT NOT NULL,
  model_id          TEXT NOT NULL,
  model_name        TEXT NOT NULL,
  category          TEXT NOT NULL CHECK(category IN ('text','image','video','audio')),
  credits_per_call  INTEGER NOT NULL,
  tier              TEXT NOT NULL DEFAULT 'basic' CHECK(tier IN ('basic','standard','premium','flagship')),
  min_plan          TEXT NOT NULL DEFAULT 'free' CHECK(min_plan IN ('free','pro')),
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, model_id)
);

CREATE INDEX IF NOT EXISTS idx_model_pricing_category ON model_pricing(category, is_active);

-- ── STRIPE-IDEMPOTENCY: processed_stripe_events ──
-- Webhook 幂等性: 防止 Stripe 事件重放导致积分重复充值
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id            TEXT PRIMARY KEY,
  event_type          TEXT NOT NULL,
  processed_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON processed_stripe_events(processed_at);

-- ── user_api_keys ─────────────────────────────
-- 用户 API Key 加密存储 (AES-256-GCM)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  encrypted_key     TEXT NOT NULL,
  label             TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  last_used_at      TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);

-- ── ai_usage_logs ─────────────────────────────
-- AI 调用日志 (分析 + 调试)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id       TEXT,
  node_id           TEXT,
  provider          TEXT NOT NULL,
  model_id          TEXT NOT NULL,
  execution_mode    TEXT NOT NULL CHECK(execution_mode IN ('credits','user_key')),
  credits_charged   INTEGER NOT NULL DEFAULT 0,
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  duration_ms       INTEGER,
  status            TEXT NOT NULL CHECK(status IN ('success','failed')),
  error_message     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_workflow ON ai_usage_logs(workflow_id);
