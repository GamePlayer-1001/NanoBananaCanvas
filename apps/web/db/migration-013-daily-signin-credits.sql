-- ============================================
--  Billing Trial Credits + Daily Sign-in
-- ============================================

ALTER TABLE credit_balances ADD COLUMN trial_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE credit_balances ADD COLUMN trial_expires_at TEXT;

CREATE TABLE IF NOT EXISTS daily_signins (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signin_date         TEXT NOT NULL,
  credits_awarded     INTEGER NOT NULL,
  expires_at          TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, signin_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_signins_user ON daily_signins(user_id, signin_date DESC);
