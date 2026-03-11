/**
 * [INPUT]: 无外部依赖，纯 D1 + R2 操作
 * [OUTPUT]: 对外提供 cleanupExpiredOutputs — 批量清理过期 AI 输出文件
 * [POS]: cron 的文件清理任务，按 plan 保留期过滤 (free=7d, pro=90d)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/** 清理过期的 AI 输出文件 (SQL 层按 plan 保留期过滤) */
export async function cleanupExpiredOutputs(
  db: D1Database,
  r2: R2Bucket,
): Promise<{ deleted: number; errors: number }> {
  const { results } = await db
    .prepare(
      `SELECT t.id, t.output_data
       FROM async_tasks t
       LEFT JOIN subscriptions s ON s.user_id = t.user_id
       WHERE t.status = 'completed'
         AND t.output_data IS NOT NULL
         AND t.completed_at IS NOT NULL
         AND (
           (COALESCE(s.plan, 'free') = 'free'
            AND t.completed_at < datetime('now', '-7 days'))
           OR
           (COALESCE(s.plan, 'free') = 'pro'
            AND t.completed_at < datetime('now', '-90 days'))
         )
       LIMIT 200`,
    )
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
