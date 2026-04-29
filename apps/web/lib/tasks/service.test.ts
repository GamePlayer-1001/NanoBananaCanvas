/**
 * [INPUT]: 依赖 vitest，依赖 ./service，依赖 @/services/ai 的 getPlatformKey mock
 * [OUTPUT]: 任务服务测试，覆盖平台前置失败时的错误包装语义与延后执行图片任务的落库/大 payload 清洗
 * [POS]: lib/tasks 的服务层回归测试，防止平台密钥缺失重新退化成 UNKNOWN 500，并保护图片任务从前台同步阻塞切回后台执行
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorCode, TaskError } from '@/lib/errors'

vi.mock('@/services/ai', () => ({
  getPlatformKey: vi.fn(),
}))

vi.mock('@/lib/billing/metering', () => ({
  estimateBillableUnits: vi.fn(() => ({
    billableUnits: 1,
    category: 'image',
    unitLabel: 'image',
    basis: 'count',
  })),
  estimateCreditsFromUsage: vi.fn(() => 0),
  getModelPricing: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/billing/ledger', () => ({
  confirmFrozenCredits: vi.fn(),
  freezeCredits: vi.fn(),
  refundFrozenCredits: vi.fn(),
}))

const { r2Mock } = vi.hoisted(() => ({
  r2Mock: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/r2', () => ({
  getR2: vi.fn().mockResolvedValue(r2Mock),
}))

vi.mock('@/lib/storage', () => ({
  extractR2KeyFromFileUrl: vi.fn(() => null),
  generateOutputPath: vi.fn(() => 'outputs/user-1/task-1.png'),
  invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
  toInternalFileUrl: vi.fn((key: string) => `/api/files/${key}`),
}))

vi.mock('./processors', () => ({
  getProcessor: vi.fn(),
}))

import { getPlatformKey } from '@/services/ai'
import { getProcessor } from './processors'

import { checkTask, processDeferredTask, processQueuedTask, submitTask } from './service'

interface PreparedCall {
  sql: string
  args: unknown[]
}

function createDbMock(
  activeCount = 0,
  taskRow: Record<string, unknown> | null = null,
): D1Database & { __calls: PreparedCall[] } {
  const calls: PreparedCall[] = []

  return {
    __calls: calls,
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => {
        calls.push({ sql, args })

        if (sql.includes('COUNT(*) as cnt')) {
          return {
            first: vi.fn().mockResolvedValue({ cnt: activeCount }),
          }
        }

        if (sql.includes('INSERT INTO async_tasks')) {
          return {
            run: vi.fn().mockResolvedValue(undefined),
          }
        }

        if (sql.includes('SELECT * FROM async_tasks WHERE id = ? AND user_id = ?')) {
          return {
            first: vi.fn().mockResolvedValue(taskRow),
          }
        }

        if (sql.includes('UPDATE async_tasks')) {
          if (
            taskRow &&
            sql.includes("SET status = 'running', progress = 5")
          ) {
            return {
              run: vi.fn().mockImplementation(async () => {
                if (taskRow.status === 'pending' && taskRow.external_task_id == null) {
                  taskRow.status = 'running'
                  taskRow.progress = 5
                  taskRow.started_at = String(args[0])
                  taskRow.updated_at = String(args[1])
                  return { meta: { changes: 1 } }
                }

                return { meta: { changes: 0 } }
              }),
            }
          }

          if (taskRow && sql.includes("SET status = 'completed'")) {
            return {
              run: vi.fn().mockImplementation(async () => {
                taskRow.status = 'completed'
                taskRow.progress = 100
                taskRow.output_data = String(args[1] ?? args[0] ?? null)
                taskRow.completed_at = String(args[2] ?? args[1] ?? new Date().toISOString())
                taskRow.updated_at = String(args[4] ?? args[2] ?? new Date().toISOString())
                return { meta: { changes: 1 } }
              }),
            }
          }

          return {
            run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
          }
        }

        throw new Error(`Unexpected SQL in test: ${sql}`)
      }),
    })),
  } as unknown as D1Database & { __calls: PreparedCall[] }
}

describe('submitTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    r2Mock.put.mockResolvedValue(undefined)
    r2Mock.get.mockResolvedValue(null)
    r2Mock.delete.mockResolvedValue(undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('fake-binary').buffer,
        headers: new Headers({ 'content-type': 'image/png' }),
        status: 200,
        statusText: 'OK',
      } satisfies Partial<Response>),
    )
  })

  it('wraps missing platform key errors as TaskError', async () => {
    vi.mocked(getPlatformKey).mockRejectedValue(
      new Error('Missing required environment variable: OPENROUTER_API_KEY'),
    )

    await expect(
      submitTask(createDbMock(), {
        userId: 'user-1',
        taskType: 'image_gen',
        provider: 'openrouter',
        modelId: 'openai/dall-e-3',
        executionMode: 'platform',
        input: { prompt: 'test prompt' },
      }),
    ).rejects.toMatchObject({
      name: 'TaskError',
      code: ErrorCode.TASK_PROVIDER_ERROR,
      message: 'Missing required environment variable: OPENROUTER_API_KEY',
    } satisfies Partial<TaskError>)
  })

  it('queues image tasks first and sanitizes oversized payloads before background execution', async () => {
    vi.mocked(getPlatformKey).mockResolvedValue('platform-key')
    vi.mocked(getProcessor).mockReturnValue({
      taskType: 'image_gen',
      provider: 'openrouter',
      submit: vi.fn().mockResolvedValue({
        externalTaskId: null,
        initialStatus: 'completed',
        result: {
          type: 'url',
          url: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
          contentType: 'image/png',
        },
      }),
      checkStatus: vi.fn(),
      cancel: vi.fn(),
    })

    const db = createDbMock()
    const task = await submitTask(db, {
      userId: 'user-1',
      taskType: 'image_gen',
      provider: 'openrouter',
      modelId: 'openai/dall-e-3',
      executionMode: 'platform',
      input: {
        prompt: 'test prompt',
        imageUrl: 'data:image/png;base64,AAAA',
      },
    })

    const insertCall = db.__calls.find((call) => call.sql.includes('INSERT INTO async_tasks'))
    expect(insertCall).toBeDefined()
    expect(insertCall?.args[5]).toBeNull()
    expect(insertCall?.args[8]).toBe('pending')
    expect(insertCall?.args[9]).toBe(0)
    expect(insertCall?.args[16]).toBeNull()

    const persistedInput = JSON.parse(String(insertCall?.args[7])) as {
      imageUrl: { __type: string; mediaType: string; length: number }
    }
    expect(persistedInput.imageUrl).toEqual({
      __type: 'omitted-data-url',
      mediaType: 'image/png',
      length: 'data:image/png;base64,AAAA'.length,
    })

    expect(task.status).toBe('pending')
    expect(task.output).toBeNull()
    expect(task.deferredExecution).toMatchObject({
      taskId: task.id,
      resolvedProvider: 'openrouter',
      resolvedModelId: 'openai/dall-e-3',
    })
  })

  it('completes deferred image tasks in background and updates persistence with internal output url', async () => {
    vi.mocked(getPlatformKey).mockResolvedValue('platform-key')
    vi.mocked(getProcessor).mockReturnValue({
      taskType: 'image_gen',
      provider: 'openrouter',
      submit: vi.fn().mockResolvedValue({
        externalTaskId: null,
        initialStatus: 'completed',
        result: {
          type: 'url',
          url: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
          contentType: 'image/png',
        },
      }),
      checkStatus: vi.fn(),
      cancel: vi.fn(),
    })

    const db = createDbMock()
    const task = await submitTask(db, {
      userId: 'user-1',
      taskType: 'image_gen',
      provider: 'openrouter',
      modelId: 'openai/dall-e-3',
      executionMode: 'platform',
      input: { prompt: 'test prompt' },
    })

    expect(task.deferredExecution).toBeDefined()
    await processDeferredTask(db, task.deferredExecution!)

    const completionUpdate = db.__calls.find(
      (call) =>
        call.sql.includes("SET status = 'completed'") &&
        call.sql.includes('output_data = ?'),
    )

    expect(completionUpdate).toBeDefined()
    expect(String(completionUpdate?.args[1])).toContain('/api/files/outputs/user-1/task-1.png')
  })

  it('rebuilds queued image tasks from persisted payload snapshots', async () => {
    vi.mocked(getPlatformKey).mockResolvedValue('platform-key')
    vi.mocked(getProcessor).mockReturnValue({
      taskType: 'image_gen',
      provider: 'openrouter',
      submit: vi.fn().mockResolvedValue({
        externalTaskId: null,
        initialStatus: 'completed',
        result: {
          type: 'url',
          url: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
          contentType: 'image/png',
        },
      }),
      checkStatus: vi.fn(),
      cancel: vi.fn(),
    })

    const submitDb = createDbMock()
    const task = await submitTask(submitDb, {
      userId: 'user-1',
      taskType: 'image_gen',
      provider: 'openrouter',
      modelId: 'openai/dall-e-3',
      executionMode: 'platform',
      input: { prompt: 'test prompt' },
    })

    const insertCall = submitDb.__calls.find((call) => call.sql.includes('INSERT INTO async_tasks'))
    expect(insertCall).toBeDefined()

    const deferredPayload = String(r2Mock.put.mock.calls[0]?.[1] ?? '{}')
    r2Mock.get.mockResolvedValue({
      json: async () => JSON.parse(deferredPayload),
    })

    const queuedDb = createDbMock(0, {
      id: task.id,
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'openrouter',
      model_id: 'openai/dall-e-3',
      external_task_id: null,
      execution_mode: 'platform',
      input_data: String(insertCall?.args[7]),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: null,
      node_id: null,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })

    await processQueuedTask(queuedDb, {
      taskId: task.id,
      userId: 'user-1',
    })

    const completionUpdate = queuedDb.__calls.find(
      (call) =>
        call.sql.includes("SET status = 'completed'") &&
        call.sql.includes('output_data = ?'),
    )

    expect(completionUpdate).toBeDefined()
    expect(r2Mock.delete).toHaveBeenCalledWith(`task-inputs/user-1/${task.id}.json`)
  })

  it('self-heals stalled queued image tasks from polling when queue execution is missing', async () => {
    vi.mocked(getPlatformKey).mockResolvedValue('platform-key')
    vi.mocked(getProcessor).mockReturnValue({
      taskType: 'image_gen',
      provider: 'openrouter',
      submit: vi.fn().mockResolvedValue({
        externalTaskId: null,
        initialStatus: 'completed',
        result: {
          type: 'url',
          url: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
          contentType: 'image/png',
        },
      }),
      checkStatus: vi.fn(),
      cancel: vi.fn(),
    })

    const submitDb = createDbMock()
    const task = await submitTask(submitDb, {
      userId: 'user-1',
      taskType: 'image_gen',
      provider: 'openrouter',
      modelId: 'openai/dall-e-3',
      executionMode: 'platform',
      input: { prompt: 'test prompt' },
    })

    const insertCall = submitDb.__calls.find((call) => call.sql.includes('INSERT INTO async_tasks'))
    expect(insertCall).toBeDefined()

    const deferredPayload = String(r2Mock.put.mock.calls[0]?.[1] ?? '{}')
    r2Mock.get.mockResolvedValue({
      json: async () => JSON.parse(deferredPayload),
    })

    const queuedRow = {
      id: task.id,
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'openrouter',
      model_id: 'openai/dall-e-3',
      external_task_id: null,
      execution_mode: 'platform',
      input_data: String(insertCall?.args[7]),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: null,
      node_id: null,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    }

    const pollingDb = createDbMock(0, queuedRow)
    const enqueueTask = vi.fn().mockResolvedValue(undefined)
    const detail = await checkTask(pollingDb, task.id, 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      enqueueTask,
    })

    expect(detail.status).toBe('pending')
    expect(detail.output).toBeNull()
    expect(enqueueTask).toHaveBeenCalledWith({
      taskId: task.id,
      userId: 'user-1',
    })
  })
})
