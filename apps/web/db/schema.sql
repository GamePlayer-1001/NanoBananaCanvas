-- ============================================
--  Nano Banana Canvas — D1 Database Schema
--  Engine: SQLite (Cloudflare D1)
--  Version: 4.0 (M8 + P2 + Stripe billing rebuild)
-- ============================================

PRAGMA foreign_keys = ON;

-- ── DB-001: users ────────────────────────────
-- 当前用户镜像表，匿名访客与未来登录身份都统一落在这里
-- `clerk_id` 为历史身份列，当前用于存放兼容身份键，后续重构登录时再迁移
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  clerk_id      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  username      TEXT NOT NULL DEFAULT '',
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT DEFAULT '',
  plan          TEXT NOT NULL DEFAULT 'free',
  membership_status TEXT NOT NULL DEFAULT 'free',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── DB-006: categories ──────────────────────
-- 工作流分类（name_i18n 为多语言真相源，name_en/name_zh 保留为历史兼容列）
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name_i18n     TEXT NOT NULL DEFAULT '{}',
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
--  Stripe Billing Runtime (SPAY-300 ~ 308)
-- ============================================

-- ── billing credit_balances ──────────────────
-- 双池余额：订阅积分 + 永久积分，并保留冻结态
CREATE TABLE IF NOT EXISTS credit_balances (
  user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_balance     INTEGER NOT NULL DEFAULT 0,
  permanent_balance   INTEGER NOT NULL DEFAULT 0,
  frozen_credits      INTEGER NOT NULL DEFAULT 0,
  total_earned        INTEGER NOT NULL DEFAULT 0,
  total_spent         INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── billing credit_transactions ──────────────
-- 所有积分变化的审计日志
CREATE TABLE IF NOT EXISTS credit_transactions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK(type IN ('earn', 'spend', 'freeze', 'unfreeze', 'refund')),
  pool                TEXT NOT NULL DEFAULT 'permanent' CHECK(pool IN ('monthly', 'permanent')),
  amount              INTEGER NOT NULL,
  balance_after       INTEGER NOT NULL,
  source              TEXT NOT NULL,
  reference_id        TEXT,
  description         TEXT DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_ref ON credit_transactions(reference_id);

-- ── billing subscriptions ────────────────────
-- 本地订阅/套餐权益镜像，Free 也在此表达默认态
CREATE TABLE IF NOT EXISTS subscriptions (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id    TEXT,
  stripe_customer_id        TEXT,
  plan                      TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'standard', 'pro', 'ultimate')),
  purchase_mode             TEXT NOT NULL DEFAULT 'auto_monthly' CHECK(purchase_mode IN ('auto_monthly', 'one_time')),
  billing_period            TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_period IN ('monthly', 'one_time')),
  status                    TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start      TEXT,
  current_period_end        TEXT,
  monthly_credits           INTEGER NOT NULL DEFAULT 0,
  storage_gb                INTEGER NOT NULL DEFAULT 1,
  cancel_at_period_end      INTEGER NOT NULL DEFAULT 0,
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);

-- ── billing model_pricing ────────────────────
-- token/生成量折算积分定价表
CREATE TABLE IF NOT EXISTS model_pricing (
  id                        TEXT PRIMARY KEY,
  provider                  TEXT NOT NULL,
  model_id                  TEXT NOT NULL,
  model_name                TEXT NOT NULL,
  category                  TEXT NOT NULL CHECK(category IN ('text', 'image', 'video', 'audio')),
  credits_per_1k_units      INTEGER NOT NULL,
  tier                      TEXT NOT NULL DEFAULT 'basic' CHECK(tier IN ('basic', 'standard', 'premium', 'flagship')),
  min_plan                  TEXT NOT NULL DEFAULT 'free' CHECK(min_plan IN ('free', 'standard', 'pro', 'ultimate')),
  is_active                 INTEGER NOT NULL DEFAULT 1,
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, model_id)
);

CREATE INDEX IF NOT EXISTS idx_model_pricing_category ON model_pricing(category, is_active);

-- ── billing credit_packages ──────────────────
-- 可购买积分包目录
CREATE TABLE IF NOT EXISTS credit_packages (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  credits             INTEGER NOT NULL,
  price_cents         INTEGER NOT NULL,
  bonus_credits       INTEGER NOT NULL DEFAULT 0,
  is_active           INTEGER NOT NULL DEFAULT 1,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── billing processed_stripe_events ──────────
-- Stripe webhook 幂等保护
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id            TEXT PRIMARY KEY,
  event_type          TEXT NOT NULL,
  processed_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── billing_orders ───────────────────────────
-- 一次性套餐与积分包订单审计
CREATE TABLE IF NOT EXISTS billing_orders (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id  TEXT,
  stripe_customer_id        TEXT,
  order_kind                TEXT NOT NULL CHECK(order_kind IN ('plan_one_time', 'credit_pack')),
  plan                      TEXT CHECK(plan IN ('standard', 'pro', 'ultimate')),
  package_id                TEXT REFERENCES credit_packages(id) ON DELETE SET NULL,
  currency                  TEXT NOT NULL,
  amount_total              INTEGER NOT NULL,
  credits_awarded           INTEGER NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
  metadata                  TEXT NOT NULL DEFAULT '{}',
  paid_at                   TEXT,
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_billing_orders_user ON billing_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_orders_checkout ON billing_orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_billing_orders_payment_intent ON billing_orders(stripe_payment_intent_id);

-- ============================================
--  M7: AI 运行时兼容层
-- ============================================

-- ── AI-001: ai_models ─────────────────────────
-- 模型目录表 (统一免费平台模式，仅保留模型选择所需字段)
CREATE TABLE IF NOT EXISTS ai_models (
  id                TEXT PRIMARY KEY,
  provider          TEXT NOT NULL,
  model_id          TEXT NOT NULL,
  model_name        TEXT NOT NULL,
  category          TEXT NOT NULL CHECK(category IN ('text','image','video','audio')),
  tier              TEXT NOT NULL DEFAULT 'basic' CHECK(tier IN ('basic','standard','premium','flagship')),
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, model_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_models_category ON ai_models(category, is_active);

-- ── user_api_keys ─────────────────────────────
-- 用户模型配置加密存储 (AES-256-GCM)
-- provider 字段作为“配置槽位 ID”使用，例如 llm-openai / image-openai / image-google
-- encrypted_key 内部保存 JSON 明文加密后的密文，结构见 lib/user-model-config.ts
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
  execution_mode    TEXT NOT NULL CHECK(execution_mode IN ('platform','user_key')),
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  billable_units    INTEGER,
  estimated_credits INTEGER,
  duration_ms       INTEGER,
  status            TEXT NOT NULL CHECK(status IN ('success','failed')),
  error_message     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_workflow ON ai_usage_logs(workflow_id);

-- ============================================
--  P2: 异步任务队列 (Method C: D1-as-Queue)
-- ============================================

-- ── QUEUE-001: async_tasks ──────────────────
-- D1-as-Queue: 任务表既是持久化层又是调度层
-- 客户端轮询驱动状态检查 (懒评估)
CREATE TABLE IF NOT EXISTS async_tasks (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id       TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  node_id           TEXT,
  task_type         TEXT NOT NULL CHECK(task_type IN ('video_gen','image_gen','audio_gen')),
  provider          TEXT NOT NULL,
  model_id          TEXT NOT NULL,
  external_task_id  TEXT,
  execution_mode    TEXT NOT NULL CHECK(execution_mode IN ('platform','user_key')),
  input_data        TEXT NOT NULL DEFAULT '{}',
  output_data       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','running','completed','failed','cancelled')),
  progress          INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  max_retries       INTEGER NOT NULL DEFAULT 2,
  last_checked_at   TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  started_at        TEXT,
  completed_at      TEXT,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_async_tasks_user_status ON async_tasks(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_async_tasks_active ON async_tasks(user_id, status) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_async_tasks_workflow ON async_tasks(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_async_tasks_external ON async_tasks(external_task_id) WHERE external_task_id IS NOT NULL;

-- ============================================
--  P2: 执行历史 (ADV-003)
-- ============================================

-- ── execution_history ─────────────────────────
-- 记录每次工作流执行的结果摘要
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

-- ── agent_audit_logs ──────────────────────────
-- 记录 Agent 共创过程中的提案、确认、执行、结果与回放索引
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

-- ── video_analysis_history ───────────────────
-- 用户级视频分析历史，保存文件元信息、执行状态与结构化分析结果
CREATE TABLE IF NOT EXISTS video_analysis_history (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_size         INTEGER NOT NULL DEFAULT 0,
  mime_type         TEXT NOT NULL DEFAULT '',
  duration_seconds  REAL NOT NULL DEFAULT 0,
  model_id          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'processing'
                    CHECK(status IN ('processing','completed','failed')),
  error_message     TEXT,
  result_json       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_video_analysis_history_user
  ON video_analysis_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analysis_history_active
  ON video_analysis_history(user_id, status, created_at DESC);
