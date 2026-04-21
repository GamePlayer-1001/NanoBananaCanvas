-- ============================================
--  M9: users 账户资料扩展
-- ============================================
--
-- 目的:
-- 1. 为 Clerk 账户镜像补齐 username / first_name / last_name
-- 2. 为业务账户态补齐 membership_status，避免继续把 plan 当唯一会员语义
--
-- 注意:
-- SQLite/D1 的 ADD COLUMN 为一次性迁移，不可重复执行。

ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN membership_status TEXT NOT NULL DEFAULT 'free';
