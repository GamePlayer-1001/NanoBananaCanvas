-- ============================================
--  MIGRATION: async_tasks 异步任务队列表
--  P2 QUEUE-001/002 — Method C (D1-as-Queue)
--  Version: 3.0
-- ============================================

-- ── async_tasks ─────────────────────────────
-- D1-as-Queue: 任务表既是持久化层又是调度层
-- 客户端轮询驱动状态检查 (懒评估)
CREATE TABLE IF NOT EXISTS async_tasks (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_id       TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  node_id           TEXT,

  -- 任务分类
  task_type         TEXT NOT NULL CHECK(task_type IN ('video_gen','image_gen','audio_gen')),
  provider          TEXT NOT NULL,
  model_id          TEXT NOT NULL,

  -- 外部 Provider
  external_task_id  TEXT,
  execution_mode    TEXT NOT NULL CHECK(execution_mode IN ('credits','user_key')),

  -- 输入/输出 (JSON)
  input_data        TEXT NOT NULL DEFAULT '{}',
  output_data       TEXT,

  -- 状态机 (5 态: pending → running → completed/failed/cancelled)
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','running','completed','failed','cancelled')),
  progress          INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT,

  -- 积分关联
  credits_charged   INTEGER NOT NULL DEFAULT 0,
  freeze_tx_id      TEXT,

  -- 重试与节流
  retry_count       INTEGER NOT NULL DEFAULT 0,
  max_retries       INTEGER NOT NULL DEFAULT 2,
  last_checked_at   TEXT,

  -- 时间戳
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  started_at        TEXT,
  completed_at      TEXT,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 用户任务列表 (按状态筛选 + 时间排序)
CREATE INDEX IF NOT EXISTS idx_async_tasks_user_status
  ON async_tasks(user_id, status, created_at DESC);

-- 活跃任务快速计数 (并发控制)
CREATE INDEX IF NOT EXISTS idx_async_tasks_active
  ON async_tasks(user_id, status)
  WHERE status IN ('pending', 'running');

-- 关联工作流
CREATE INDEX IF NOT EXISTS idx_async_tasks_workflow
  ON async_tasks(workflow_id)
  WHERE workflow_id IS NOT NULL;

-- 外部任务 ID 查找
CREATE INDEX IF NOT EXISTS idx_async_tasks_external
  ON async_tasks(external_task_id)
  WHERE external_task_id IS NOT NULL;
