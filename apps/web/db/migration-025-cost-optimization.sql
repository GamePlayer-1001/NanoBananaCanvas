-- Migration 025 - Cost optimization hardening
-- Add hot-path indexes and remove legacy subscriptions.storage_gb residue.

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_desc
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflows_user_updated
  ON workflows(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflows_user_folder_updated
  ON workflows(user_id, folder_id, updated_at DESC);

PRAGMA foreign_keys = OFF;

CREATE TABLE subscriptions_v2 (
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
  cancel_at_period_end      INTEGER NOT NULL DEFAULT 0,
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO subscriptions_v2 (
  id,
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  plan,
  purchase_mode,
  billing_period,
  status,
  current_period_start,
  current_period_end,
  monthly_credits,
  cancel_at_period_end,
  created_at,
  updated_at
)
SELECT
  id,
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  plan,
  purchase_mode,
  billing_period,
  status,
  current_period_start,
  current_period_end,
  monthly_credits,
  cancel_at_period_end,
  created_at,
  updated_at
FROM subscriptions;

DROP TABLE subscriptions;
ALTER TABLE subscriptions_v2 RENAME TO subscriptions;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);

PRAGMA foreign_keys = ON;
