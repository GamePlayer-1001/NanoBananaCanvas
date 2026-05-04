-- 为历史生产库补齐 trial pool 约束，统一 credit_transactions 与 schema.sql 真相源

CREATE TABLE IF NOT EXISTS credit_transactions_v2 (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL,
  type                TEXT NOT NULL CHECK(type IN ('purchase', 'spend', 'refund', 'freeze', 'unfreeze')),
  pool                TEXT NOT NULL DEFAULT 'permanent' CHECK(pool IN ('trial', 'monthly', 'permanent')),
  amount              INTEGER NOT NULL,
  balance_after       INTEGER NOT NULL DEFAULT 0,
  source              TEXT NOT NULL,
  reference_id        TEXT,
  description         TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO credit_transactions_v2 (
  id,
  user_id,
  type,
  pool,
  amount,
  balance_after,
  source,
  reference_id,
  description,
  created_at
)
SELECT
  id,
  user_id,
  type,
  pool,
  amount,
  balance_after,
  source,
  reference_id,
  description,
  created_at
FROM credit_transactions;

DROP TABLE credit_transactions;

ALTER TABLE credit_transactions_v2 RENAME TO credit_transactions;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_ref
  ON credit_transactions(reference_id);
