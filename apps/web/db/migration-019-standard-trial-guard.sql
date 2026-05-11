-- Migration 019 - Standard trial account guard
-- Prevents the same account from repeatedly opening the 30-day Standard trial.

ALTER TABLE users ADD COLUMN standard_trial_used_at TEXT;
