/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/tasks, @/lib/validations/task
 * [OUTPUT]: 对外提供 POST /api/tasks (提交任务) + GET /api/tasks (列表)
 * [POS]: api/tasks 的入口端点，编排 auth → validate → service → response
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { listTasks, submitTask } from '@/lib/tasks'
import { listTasksSchema, submitTaskSchema } from '@/lib/validations/task'

/* ─── POST /api/tasks — 提交任务 ────────────────────── */

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge
  const blocked = withRateLimit(req, 'task-submit', 10, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const body = await req.json()
    const params = submitTaskSchema.parse(body)

    /* 获取用户套餐 */
    const sub = await db
      .prepare('SELECT plan FROM subscriptions WHERE user_id = ?')
      .bind(userId)
      .first<{ plan: string }>()
    const userPlan = sub?.plan ?? 'free'

    const task = await submitTask(db, {
      userId,
      userPlan,
      taskType: params.taskType,
      provider: params.provider,
      modelId: params.modelId,
      executionMode: params.executionMode,
      input: params.input,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
    })

    return apiOk(task, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── GET /api/tasks — 任务列表 ─────────────────────── */

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const url = new URL(req.url)
    const params = listTasksSchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      taskType: url.searchParams.get('taskType') ?? undefined,
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '20',
    })

    const result = await listTasks(db, userId, params)
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
