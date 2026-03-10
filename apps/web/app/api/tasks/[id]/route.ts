/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/tasks
 * [OUTPUT]: 对外提供 GET /api/tasks/:id (查询任务状态 + 懒评估)
 * [POS]: api/tasks/[id] 的状态查询端点，触发 checkTask 懒评估
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { checkTask } from '@/lib/tasks'

/* ─── GET /api/tasks/:id — 状态查询 + 懒评估 ───────── */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const { id } = await params

    const task = await checkTask(db, id, userId)
    return apiOk(task)
  } catch (error) {
    return handleApiError(error)
  }
}
