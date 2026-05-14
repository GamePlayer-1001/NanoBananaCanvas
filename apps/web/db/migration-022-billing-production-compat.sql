-- Migration 022 - Billing production compatibility
-- Backfill columns that older production billing schema is missing but current runtime depends on.

ALTER TABLE users ADD COLUMN standard_trial_used_at TEXT;
ALTER TABLE subscriptions ADD COLUMN purchase_mode TEXT NOT NULL DEFAULT 'auto_monthly' CHECK(purchase_mode IN ('auto_monthly', 'one_time'));
