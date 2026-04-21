-- ============================================
--  M11: Stripe Billing Runtime Rebuild
--  目标:
--  1. 在当前运行时恢复账本/订阅/定价/积分包/Stripe 幂等表
--  2. 保持可重复执行，避免与现有免费运行时表冲突
--  3. 为一次性套餐与积分包补充本地订单审计表 billing_orders
-- ============================================

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

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id            TEXT PRIMARY KEY,
  event_type          TEXT NOT NULL,
  processed_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

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
