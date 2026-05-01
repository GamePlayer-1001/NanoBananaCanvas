/**
 * [INPUT]: 依赖 vitest，依赖 ./service，依赖 @/services/ai 的平台密钥 mock
 * [OUTPUT]: 任务服务测试，覆盖平台前置失败时的错误包装语义、图片任务执行快照落库/大 payload 清洗、dispatch 分流、user_key 后台凭据回放与分发失败收口
 * [POS]: lib/tasks 的服务层回归测试，防止平台密钥缺失重新退化成 UNKNOWN 500，并保护图片任务从前台同步阻塞切回后台执行与后台黑洞显式失败
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorCode, TaskError } from '@/lib/errors'

vi.mock('@/services/ai', () => ({
  getPlatformKey: vi.fn(),
  getPlatformSupplierApiKey: vi.fn(),
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

import { getPlatformKey, getPlatformSupplierApiKey } from '@/services/ai'
import { getProcessor } from './processors'

import { checkTask, processTaskDispatch, submitTask } from './service'

interface PreparedCall {
  sql: string
  args: unknown[]
}

function createDbMock(
  activeCount = 0,
  taskRow: Record<string, unknown> | null = null,
  options?: {
    activeRows?: Record<string, unknown>[]
    dynamicActiveCount?: boolean
  },
): D1Database & { __calls: PreparedCall[] } {
  const calls: PreparedCall[] = []
  const activeRows = options?.activeRows ?? (taskRow ? [taskRow] : [])

  return {
    __calls: calls,
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => {
        calls.push({ sql, args })

        if (sql.includes('COUNT(*) as cnt')) {
          const dynamicCount = options?.dynamicActiveCount
            ? activeRows.filter(
                (row) => row.status === 'pending' || row.status === 'running',
              ).length
            : activeCount
          return {
            first: vi.fn().mockResolvedValue({ cnt: dynamicCount }),
          }
        }

        if (
          sql.includes('SELECT * FROM async_tasks') &&
          sql.includes("status IN ('pending', 'running')") &&
          sql.includes('ORDER BY created_at DESC') &&
          !sql.includes('workflow_id = ?')
        ) {
          return {
            all: vi.fn().mockResolvedValue({ results: activeRows }),
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

        if (
          sql.includes('SELECT * FROM async_tasks') &&
          sql.includes('workflow_id = ?') &&
          sql.includes('node_id = ?')
        ) {
          return {
            first: vi.fn().mockResolvedValue(taskRow),
          }
        }

        if (sql.includes('UPDATE async_tasks')) {
          if (
            taskRow &&
            sql.includes("SET status = 'running', progress = ?")
          ) {
            return {
              run: vi.fn().mockImplementation(async () => {
                if (taskRow.status === 'pending' && taskRow.external_task_id == null) {
                  taskRow.status = 'running'
                  taskRow.progress = Number(args[0] ?? 5)
                  taskRow.started_at = String(args[1] ?? new Date().toISOString())
                  taskRow.updated_at = String(args[3] ?? args[2] ?? new Date().toISOString())
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

          if (sql.includes("SET status = 'failed'")) {
            return {
              run: vi.fn().mockImplementation(async () => {
                const failedRow =
                  activeRows.find((row) => row.id === args[3]) ??
                  (taskRow && taskRow.id === args[3] ? taskRow : null)

                if (failedRow) {
                  failedRow.status = 'failed'
                  failedRow.output_data = String(args[0] ?? null)
                  failedRow.completed_at = String(args[1] ?? new Date().toISOString())
                  failedRow.updated_at = String(args[2] ?? new Date().toISOString())
                }

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
    vi.mocked(getPlatformSupplierApiKey).mockResolvedValue('platform-key')
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
    vi.mocked(getPlatformSupplierApiKey).mockRejectedValue(
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
    expect(task.dispatch).toMatchObject({
      taskId: task.id,
      orchestrator: 'legacy_queue',
    })
  })

  it('reuses the latest active task when the same workflow node is rerun', async () => {
    const activeRow = {
      id: 'active-task-1',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'openrouter',
      model_id: 'openai/dall-e-3',
      external_task_id: null,
      execution_mode: 'platform',
      input_data: JSON.stringify({
        prompt: 'existing prompt',
        __taskRuntime: {
          orchestrator: 'workflow',
        },
      }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: 'workflow-1',
      node_id: 'node-1',
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    }

    const db = createDbMock(0, activeRow)

    const task = await submitTask(db, {
      userId: 'user-1',
      taskType: 'image_gen',
      provider: 'openrouter',
      modelId: 'openai/dall-e-3',
      executionMode: 'platform',
      workflowId: 'workflow-1',
      nodeId: 'node-1',
      input: { prompt: 'new prompt' },
    }, {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      getWorkflowStatus: vi.fn().mockResolvedValue({
        status: 'running',
      }),
    })

    expect(task.id).toBe('active-task-1')
    expect(task.status).toBe('running')
    expect(
      db.__calls.some((call) => call.sql.includes('INSERT INTO async_tasks')),
    ).toBe(false)
  })

  it('releases expired active slots before concurrency check so new submissions can continue', async () => {
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

    const oldCreatedAt = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
    const staleRow = {
      id: 'stale-active-task',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'openrouter',
      model_id: 'openai/dall-e-3',
      external_task_id: null,
      execution_mode: 'platform',
      input_data: JSON.stringify({ prompt: 'stale prompt' }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: null,
      node_id: null,
      created_at: oldCreatedAt,
      started_at: null,
      completed_at: null,
      updated_at: oldCreatedAt,
    }

    const db = createDbMock(1, null, {
      activeRows: [staleRow],
      dynamicActiveCount: true,
    })

    const task = await submitTask(db, {
      userId: 'user-1',
      taskType: 'image_gen',
      provider: 'openrouter',
      modelId: 'openai/dall-e-3',
      executionMode: 'platform',
      workflowId: 'workflow-2',
      nodeId: 'node-2',
      input: { prompt: 'fresh prompt' },
    })

    expect(task.id).not.toBe('stale-active-task')
    expect(staleRow.status).toBe('failed')
    expect(
      db.__calls.some(
        (call) =>
          call.sql.includes("SET status = 'failed'") &&
          String(call.args[0]).includes('before new submission'),
      ),
    ).toBe(true)
    expect(
      db.__calls.some((call) => call.sql.includes('INSERT INTO async_tasks')),
    ).toBe(true)
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

    const executionSnapshot = String(r2Mock.put.mock.calls[0]?.[1] ?? '{}')
    r2Mock.get.mockResolvedValue({
      json: async () => JSON.parse(executionSnapshot),
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

    expect(task.dispatch).toBeDefined()
    await processTaskDispatch(queuedDb, {
      taskId: task.id,
      userId: 'user-1',
    })

    const completionUpdate = queuedDb.__calls.find(
      (call) =>
        call.sql.includes("status = 'completed'") &&
        call.sql.includes('output_data = ?'),
    )

    expect(completionUpdate).toBeDefined()
    expect(String(completionUpdate?.args[3])).toContain('/api/files/outputs/user-1/task-1.png')
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

    const executionSnapshot = String(r2Mock.put.mock.calls[0]?.[1] ?? '{}')
    r2Mock.get.mockResolvedValue({
      json: async () => JSON.parse(executionSnapshot),
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

    await processTaskDispatch(queuedDb, {
      taskId: task.id,
      userId: 'user-1',
    })

    const completionUpdate = queuedDb.__calls.find(
      (call) =>
        call.sql.includes("status = 'completed'") &&
        call.sql.includes('output_data = ?'),
    )

    expect(completionUpdate).toBeDefined()
    expect(r2Mock.delete).toHaveBeenCalledWith(`task-inputs/user-1/${task.id}.json`)
  })

  it('replays user_key runtime credentials from task execution snapshot without requiring ENCRYPTION_KEY in worker', async () => {
    vi.mocked(getProcessor).mockReturnValue({
      taskType: 'image_gen',
      provider: 'openai-compatible',
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

    const taskId = 'task-user-key-replay'
    r2Mock.get.mockResolvedValue({
      json: async () => ({
        taskType: 'image_gen',
        requestProvider: 'image',
        resolvedProvider: 'openai-compatible',
        resolvedModelId: 'gpt-image-2',
        executionMode: 'user_key',
        resolvedInput: {
          prompt: 'test prompt',
          baseUrl: 'https://api.openai.com/v1',
        },
        originalInput: {
          prompt: 'test prompt',
        },
        apiKey: 'user-api-key',
        runtimeConfig: {
          configId: 'image-config',
          providerId: 'openai-compatible',
          capability: 'image',
          modelId: 'gpt-image-2',
          apiKey: 'user-api-key',
          baseUrl: 'https://api.openai.com/v1',
        },
        runtimeMeta: {
          userConfigId: 'image-config',
          orchestrator: 'workflow',
        },
      }),
    })

    const queuedDb = createDbMock(0, {
      id: taskId,
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'image',
      model_id: 'gpt-image-2',
      external_task_id: null,
      execution_mode: 'user_key',
      input_data: JSON.stringify({
        prompt: 'test prompt',
        __taskRuntime: {
          userConfigId: 'image-config',
          orchestrator: 'workflow',
        },
      }),
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

    await processTaskDispatch(queuedDb, {
      taskId,
      userId: 'user-1',
    }, {
      requireEnv: vi.fn().mockRejectedValue(new Error('should not require env')),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockRejectedValue(new Error('should not require platform key')),
    })

    const completionUpdate = queuedDb.__calls.find(
      (call) =>
        call.sql.includes("status = 'completed'") &&
        call.sql.includes('output_data = ?'),
    )

    expect(completionUpdate).toBeDefined()
    expect(r2Mock.delete).toHaveBeenCalledWith(`task-inputs/user-1/${taskId}.json`)
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

    const executionSnapshot = String(r2Mock.put.mock.calls[0]?.[1] ?? '{}')
    r2Mock.get.mockResolvedValue({
      json: async () => JSON.parse(executionSnapshot),
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
    const dispatchTask = vi.fn().mockResolvedValue(undefined)
    const detail = await checkTask(pollingDb, task.id, 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      dispatchTask,
    })

    expect(detail.status).toBe('pending')
    expect(detail.output).toBeNull()
    expect(dispatchTask).toHaveBeenCalledWith({
      taskId: task.id,
      userId: 'user-1',
    })
  })

  it('does not re-enqueue workflow-managed image tasks during polling self-heal', async () => {
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
      orchestrator: 'workflow',
    })

    const insertCall = submitDb.__calls.find((call) => call.sql.includes('INSERT INTO async_tasks'))
    expect(insertCall).toBeDefined()
    expect(task.dispatch?.orchestrator).toBe('workflow')

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
    const dispatchTask = vi.fn().mockResolvedValue(undefined)
    const detail = await checkTask(pollingDb, task.id, 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      dispatchTask,
    })

    expect(detail.status).toBe('pending')
    expect(dispatchTask).not.toHaveBeenCalled()
  })

  it('does not fail workflow-managed image tasks via legacy timeout checks', async () => {
    const oldCreatedAt = new Date(Date.now() - 20 * 60 * 1_000).toISOString()
    const pollingDb = createDbMock(0, {
      id: 'task-timeout-workflow',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'openrouter',
      model_id: 'openai/dall-e-3',
      external_task_id: null,
      execution_mode: 'platform',
      input_data: JSON.stringify({
        prompt: 'test prompt',
        __taskRuntime: {
          orchestrator: 'workflow',
        },
      }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: null,
      node_id: null,
      created_at: oldCreatedAt,
      started_at: null,
      completed_at: null,
      updated_at: oldCreatedAt,
    })

    const detail = await checkTask(pollingDb, 'task-timeout-workflow', 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      dispatchTask: vi.fn().mockResolvedValue(undefined),
    })

    expect(detail.status).toBe('pending')
    expect(detail.output).toBeNull()
    expect(
      pollingDb.__calls.some((call) => call.sql.includes("SET status = 'failed'")),
    ).toBe(false)
  })

  it('marks workflow-managed image tasks as failed when workflow instance reports errored', async () => {
    const createdAt = new Date().toISOString()
    const pollingDb = createDbMock(0, {
      id: 'task-workflow-errored',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'openrouter',
      model_id: 'openai/dall-e-3',
      external_task_id: null,
      execution_mode: 'platform',
      input_data: JSON.stringify({
        prompt: 'test prompt',
        __taskRuntime: {
          orchestrator: 'workflow',
        },
      }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: null,
      node_id: null,
      created_at: createdAt,
      started_at: null,
      completed_at: null,
      updated_at: createdAt,
    })

    const detail = await checkTask(pollingDb, 'task-workflow-errored', 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      getWorkflowStatus: vi.fn().mockResolvedValue({
        status: 'errored',
        error: {
          name: 'WorkflowError',
          message: 'workflow exploded',
        },
      }),
      dispatchTask: vi.fn().mockResolvedValue(undefined),
    })

    expect(detail.status).toBe('failed')
    expect(detail.output).toEqual({ error: 'workflow exploded' })
  })

  it('dispatches queue fallback when workflow task stays queued past startup grace window', async () => {
    const oldCreatedAt = new Date(Date.now() - 2 * 60 * 1_000).toISOString()
    const pollingDb = createDbMock(0, {
      id: 'task-workflow-queued-stale',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'image',
      model_id: 'gpt-image-2',
      external_task_id: null,
      execution_mode: 'user_key',
      input_data: JSON.stringify({
        prompt: '一个女孩',
        size: 'auto',
        aspectRatio: '16:9',
        __taskRuntime: {
          orchestrator: 'workflow',
          userConfigId: 'image-config',
        },
      }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: 'workflow-1',
      node_id: 'node-1',
      created_at: oldCreatedAt,
      started_at: null,
      completed_at: null,
      updated_at: oldCreatedAt,
    })

    const dispatchTask = vi.fn().mockResolvedValue(undefined)
    const detail = await checkTask(pollingDb, 'task-workflow-queued-stale', 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      getWorkflowStatus: vi.fn().mockResolvedValue({
        status: 'queued',
      }),
      dispatchTask,
    })

    expect(detail.status).toBe('pending')
    expect(dispatchTask).toHaveBeenCalledWith({
      taskId: 'task-workflow-queued-stale',
      userId: 'user-1',
    })
    expect(
      pollingDb.__calls.some(
        (call) =>
          call.sql.includes('SET last_checked_at = ?, updated_at = ?') &&
          call.args[2] === 'task-workflow-queued-stale',
      ),
    ).toBe(true)
  })

  it('fails workflow tasks that complete without updating d1 state', async () => {
    const createdAt = new Date(Date.now() - 2 * 60 * 1_000).toISOString()
    const pollingDb = createDbMock(0, {
      id: 'task-workflow-complete-pending',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'image',
      model_id: 'gpt-image-2',
      external_task_id: null,
      execution_mode: 'user_key',
      input_data: JSON.stringify({
        prompt: '一个女孩',
        size: 'auto',
        aspectRatio: '16:9',
        __taskRuntime: {
          orchestrator: 'workflow',
          userConfigId: 'image-config',
        },
      }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: 'workflow-1',
      node_id: 'node-1',
      created_at: createdAt,
      started_at: null,
      completed_at: null,
      updated_at: createdAt,
    })

    const detail = await checkTask(pollingDb, 'task-workflow-complete-pending', 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      getWorkflowStatus: vi.fn().mockResolvedValue({
        status: 'complete',
      }),
    })

    expect(detail.status).toBe('failed')
    expect(detail.output).toEqual({
      error: 'Workflow completed without updating task state',
    })
  })

  it('fails workflow tasks stuck in running when workflow already completed without external task id', async () => {
    const createdAt = new Date().toISOString()
    const pollingDb = createDbMock(0, {
      id: 'task-workflow-complete-running',
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'image',
      model_id: 'gpt-image-2',
      external_task_id: null,
      execution_mode: 'user_key',
      input_data: JSON.stringify({
        prompt: '一个女孩',
        size: 'auto',
        aspectRatio: '16:9',
        __taskRuntime: {
          orchestrator: 'workflow',
          userConfigId: 'image-config',
        },
      }),
      output_data: null,
      status: 'running',
      progress: 5,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: 'workflow-1',
      node_id: 'node-1',
      created_at: createdAt,
      started_at: createdAt,
      completed_at: null,
      updated_at: createdAt,
    })

    const detail = await checkTask(pollingDb, 'task-workflow-complete-running', 'user-1', {
      requireEnv: vi.fn(),
      getR2: vi.fn().mockResolvedValue(r2Mock),
      invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
      getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      getWorkflowStatus: vi.fn().mockResolvedValue({
        status: 'complete',
      }),
    })

    expect(detail.status).toBe('failed')
    expect(detail.output).toEqual({
      error: 'Workflow completed without updating task state',
    })
  })

  it('fails dispatched tasks when execution snapshot is missing instead of leaving them pending', async () => {
    const taskId = 'task-missing-snapshot'
    const taskRow = {
      id: taskId,
      user_id: 'user-1',
      task_type: 'image_gen',
      provider: 'image',
      model_id: 'gpt-image-2',
      external_task_id: null,
      execution_mode: 'user_key',
      input_data: JSON.stringify({
        prompt: '一个女孩',
        size: 'auto',
        aspectRatio: '16:9',
        __taskRuntime: {
          orchestrator: 'workflow',
          userConfigId: 'image-config',
        },
      }),
      output_data: null,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 2,
      last_checked_at: null,
      workflow_id: 'workflow-1',
      node_id: 'node-1',
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    }

    r2Mock.get.mockResolvedValueOnce(null)
    const db = createDbMock(0, taskRow)

    await processTaskDispatch(
      db,
      { taskId, userId: 'user-1' },
      {
        requireEnv: vi.fn(),
        getR2: vi.fn().mockResolvedValue(r2Mock),
        invalidateStorageCache: vi.fn().mockResolvedValue(undefined),
        getPlatformKey: vi.fn().mockResolvedValue('platform-key'),
      },
    )

    expect(taskRow.status).toBe('failed')
    expect(JSON.parse(String(taskRow.output_data))).toEqual({
      error: `Task execution snapshot not found for task: ${taskId}`,
    })
    expect(r2Mock.delete).toHaveBeenCalledWith(`task-inputs/user-1/${taskId}.json`)
  })
})
