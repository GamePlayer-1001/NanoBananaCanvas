/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/tasks，依赖 Cloudflare Queue/Workflow 绑定
 * [OUTPUT]: 对外提供 GET /api/tasks/:id (查询任务状态 + 懒评估 + Workflow 状态观察)
 * [POS]: api/tasks/[id] 的状态查询端点，触发 checkTask 懒评估，并在 workflow 主路观察实例状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

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
    const { env } = await getCloudflareContext()

    const task = await checkTask(db, id, userId, {
      enqueueTask: async (message) => {
        await env.TASK_QUEUE.send(message)
      },
      getWorkflowStatus: async (instanceId) => {
        const instance = await env.IMAGE_TASK_WORKFLOW.get(instanceId)
        return instance.status()
      },
      getPlatformKey: async (provider) => {
        const { getPlatformKey } = await import('@/services/ai')
        return getPlatformKey(provider)
      },
      getR2: async () => {
        const { getR2 } = await import('@/lib/r2')
        return getR2()
      },
      invalidateStorageCache: async (targetUserId) => {
        const { invalidateStorageCache } = await import('@/lib/storage')
        await invalidateStorageCache(targetUserId)
      },
      requireEnv: async (key) => {
        const { requireEnv } = await import('@/lib/env')
        return requireEnv(key)
      },
    })
    return apiOk(task)
  } catch (error) {
    return handleApiError(error)
  }
}
