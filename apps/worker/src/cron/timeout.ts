/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG
 * [OUTPUT]: 对外提供 markTimedOutTasks — 批量标记超时任务为失败
 * [POS]: cron 的超时扫描任务，按 TASK_CONFIG.timeoutMs 判定
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import type { AsyncTaskType } from '@nano-banana/shared'

interface StaleTask {
  id: string
  task_type: AsyncTaskType
  created_at: string
}

/** 扫描所有超时的 pending/running 任务，标记 failed */
export async function markTimedOutTasks(db: D1Database): Promise<number> {
  const now = Date.now()
  let total = 0

  for (const [taskType, config] of Object.entries(TASK_CONFIG)) {
    const cutoff = new Date(now - config.timeoutMs).toISOString()

    const { results } = await db
      .prepare(
        `SELECT id, task_type, created_at
         FROM async_tasks
         WHERE task_type = ?
           AND status IN ('pending', 'running')
           AND created_at < ?
         LIMIT 100`,
      )
      .bind(taskType, cutoff)
      .all<StaleTask>()

    if (!results || results.length === 0) continue

    for (const task of results) {
      const nowIso = new Date().toISOString()

      /* 标记失败 */
      await db
        .prepare(
          `UPDATE async_tasks
           SET status = 'failed',
               output_data = ?,
               completed_at = ?,
               updated_at = ?
           WHERE id = ? AND status IN ('pending', 'running')`,
        )
        .bind(
          JSON.stringify({ error: `Cron: task timed out after ${config.timeoutMs / 1000}s` }),
          nowIso,
          nowIso,
          task.id,
        )
        .run()

      total++
    }
  }

  return total
}
