/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/tasks
 * [OUTPUT]: 对外提供 POST /api/tasks/:id/cancel (取消任务)
 * [POS]: api/tasks/[id]/cancel 的取消端点，触发 Provider cancel
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { cancelTask } from '@/lib/tasks'

/* ─── POST /api/tasks/:id/cancel — 取消任务 ─────────── */

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const { id } = await params

    const task = await cancelTask(db, id, userId)
    return apiOk(task)
  } catch (error) {
    return handleApiError(error)
  }
}
