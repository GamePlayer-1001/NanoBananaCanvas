/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/tasks, @/lib/validations/task，依赖 Cloudflare Queue/Workflow 绑定
 * [OUTPUT]: 对外提供 POST /api/tasks (提交任务并消费 dispatch 指令) + GET /api/tasks (列表) + DELETE /api/tasks (批量删除终态任务)
 * [POS]: api/tasks 的入口端点，编排 auth → validate → service → dispatch → response，兼顾账户页生成作品管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { TaskOrchestrator, TaskQueueMessage } from '@nano-banana/shared'

import { requireAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { isAppError } from '@/lib/errors'
import {
  deleteTasks,
  listTasks,
  submitTask,
  type TaskExecutionDispatch,
} from '@/lib/tasks'
import { deleteTasksSchema, listTasksSchema, submitTaskSchema } from '@/lib/validations/task'
import { ZodError } from 'zod'

function resolveImageTaskOrchestrator(env: CloudflareEnv): TaskOrchestrator {
  return env.TASK_IMAGE_ORCHESTRATOR === 'workflow' ? 'workflow' : 'legacy_queue'
}

async function dispatchSubmittedTask(
  env: CloudflareEnv,
  dispatch: TaskExecutionDispatch,
): Promise<void> {
  if (dispatch.orchestrator === 'workflow') {
    await env.IMAGE_TASK_WORKFLOW.create({
      id: dispatch.taskId,
      params: {
        taskId: dispatch.taskId,
        userId: dispatch.userId,
      },
    })
    return
  }

  const message: TaskQueueMessage = {
    taskId: dispatch.taskId,
    userId: dispatch.userId,
  }
  await env.TASK_QUEUE.send(message)
}

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
    const { env } = await getCloudflareContext()
    const orchestrator = resolveImageTaskOrchestrator(env)

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
      orchestrator,
    }, {
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

    if (task.dispatch) {
      await dispatchSubmittedTask(env, task.dispatch)
    }

    const responseTask = { ...task }
    delete responseTask.dispatch
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
