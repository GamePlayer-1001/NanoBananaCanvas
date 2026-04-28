/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/tasks, @/lib/validations/task
 * [OUTPUT]: 对外提供 POST /api/tasks (提交任务) + GET /api/tasks (列表) + DELETE /api/tasks (批量删除终态任务)
 * [POS]: api/tasks 的入口端点，编排 auth → validate → service → response，兼顾账户页生成作品管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

import { requireAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { isAppError } from '@/lib/errors'
import { deleteTasks, listTasks, processDeferredTask, submitTask } from '@/lib/tasks'
import { deleteTasksSchema, listTasksSchema, submitTaskSchema } from '@/lib/validations/task'
import { ZodError } from 'zod'

/* ─── POST /api/tasks — 提交任务 ────────────────────── */

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge
  const blocked = await withRateLimit(req, 'task-submit', 10, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const body = await req.json()
    const params = submitTaskSchema.parse(body)

    const task = await submitTask(db, {
      userId,
      taskType: params.taskType,
      provider: params.provider,
      capability: params.capability,
      modelId: params.modelId,
      configId: params.configId,
      executionMode: params.executionMode,
      input: params.input,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
    })

    if (task.deferredExecution) {
      const { ctx } = await getCloudflareContext()
      ctx.waitUntil(processDeferredTask(db, task.deferredExecution))
    }

    const responseTask = { ...task }
    delete responseTask.deferredExecution
    return apiOk(responseTask, 201)
  } catch (error) {
    if (
      error instanceof Error &&
      !isAppError(error) &&
      !(error instanceof ZodError)
    ) {
      return apiError('UNKNOWN', error.message || 'Internal server error', 500)
    }
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
    if (
      error instanceof Error &&
      !isAppError(error) &&
      !(error instanceof ZodError)
    ) {
      return apiError('UNKNOWN', error.message || 'Internal server error', 500)
    }
    return handleApiError(error)
  }
}

/* ─── DELETE /api/tasks — 批量删除终态任务 ───────────── */

export async function DELETE(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const body = await req.json()
    const params = deleteTasksSchema.parse(body)

    const result = await deleteTasks(db, userId, params.ids)
    return apiOk(result)
  } catch (error) {
    if (
      error instanceof Error &&
      !isAppError(error) &&
      !(error instanceof ZodError)
    ) {
      return apiError('UNKNOWN', error.message || 'Internal server error', 500)
    }
    return handleApiError(error)
  }
}
