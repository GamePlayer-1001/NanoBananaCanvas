/**
 * [INPUT]: 依赖 D1Database / R2Bucket 绑定，消费 async_tasks 的终态记录与输出索引
 * [OUTPUT]: 对外提供 cleanupExpiredOutputs，批量清理过期 AI 输出文件与过期终态任务
 * [POS]: cron 的数据清理任务，按统一保留期收缩 R2 输出与 D1 冷数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const OUTPUT_RETENTION_DAYS = 7
const TERMINAL_TASK_RETENTION_DAYS = 14
const CLEANUP_BATCH_SIZE = 200

export interface CleanupExpiredOutputsResult {
  deleted: number
  errors: number
  prunedTasks: number
}

async function deleteExpiredTaskOutputs(
  db: D1Database,
  r2: R2Bucket,
): Promise<{ deleted: number; errors: number }> {
  const { results } = await db
    .prepare(
      `SELECT t.id, t.output_data
       FROM async_tasks t
       WHERE t.status = 'completed'
         AND t.output_data IS NOT NULL
         AND t.completed_at IS NOT NULL
         AND t.completed_at < datetime('now', ?)
       LIMIT ?`,
    )
    .bind(`-${OUTPUT_RETENTION_DAYS} days`, CLEANUP_BATCH_SIZE)
    .all<{ id: string; output_data: string }>()

  let deleted = 0
  let errors = 0

  for (const task of results) {
    try {
      const output = JSON.parse(task.output_data)
      const r2Key = output.r2_key || output.url?.replace('/api/files/', '')
      if (r2Key) {
        await r2.delete(r2Key)
        deleted++
      }
    } catch {
      errors++
    }
  }

  return { deleted, errors }
}

async function pruneExpiredTerminalTasks(db: D1Database): Promise<number> {
  const staleTasks = await db
    .prepare(
      `SELECT id
       FROM async_tasks
       WHERE status IN ('completed', 'failed', 'cancelled')
         AND COALESCE(completed_at, updated_at, created_at) < datetime('now', ?)
       ORDER BY COALESCE(completed_at, updated_at, created_at) ASC
       LIMIT ?`,
    )
    .bind(`-${TERMINAL_TASK_RETENTION_DAYS} days`, CLEANUP_BATCH_SIZE)
    .all<{ id: string }>()

  const ids = (staleTasks.results ?? []).map((row) => row.id).filter(Boolean)
  if (!ids.length) {
    return 0
  }

  const placeholders = ids.map(() => '?').join(', ')
  await db
    .prepare(`DELETE FROM async_tasks WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()

  return ids.length
}

/** 清理过期的 AI 输出文件，并顺带修剪保留期外的终态任务 */
export async function cleanupExpiredOutputs(
  db: D1Database,
  r2: R2Bucket,
): Promise<CleanupExpiredOutputsResult> {
  const outputResult = await deleteExpiredTaskOutputs(db, r2)
  const prunedTasks = await pruneExpiredTerminalTasks(db)

  return {
    ...outputResult,
    prunedTasks,
  }
}
