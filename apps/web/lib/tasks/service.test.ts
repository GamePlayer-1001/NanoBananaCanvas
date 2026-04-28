/**
 * [INPUT]: 依赖 vitest，依赖 ./service，依赖 @/services/ai 的 getPlatformKey mock
 * [OUTPUT]: 任务服务测试，覆盖平台前置失败时的错误包装语义与同步输出落库/大 payload 清洗
 * [POS]: lib/tasks 的服务层回归测试，防止平台密钥缺失重新退化成 UNKNOWN 500，并保护同步媒体任务不再把 data URL 直接塞进 D1
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

vi.mock('@/lib/r2', () => ({
  getR2: vi.fn().mockResolvedValue({
    put: vi.fn().mockResolvedValue(undefined),
  }),
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

import { submitTask } from './service'

interface PreparedCall {
  sql: string
  args: unknown[]
}

function createDbMock(activeCount = 0): D1Database & { __calls: PreparedCall[] } {
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

        throw new Error(`Unexpected SQL in test: ${sql}`)
      }),
    })),
  } as unknown as D1Database & { __calls: PreparedCall[] }
}

describe('submitTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('persists synchronous outputs without storing oversized external task ids', async () => {
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
    expect(insertCall?.args[8]).toBe('completed')
    expect(insertCall?.args[9]).toBe(100)
    expect(insertCall?.args[16]).toContain('/api/files/outputs/user-1/task-1.png')

    const persistedInput = JSON.parse(String(insertCall?.args[7])) as {
      imageUrl: { __type: string; mediaType: string; length: number }
    }
    expect(persistedInput.imageUrl).toEqual({
      __type: 'omitted-data-url',
      mediaType: 'image/png',
      length: 'data:image/png;base64,AAAA'.length,
    })

    expect(task.status).toBe('completed')
    expect(task.output).toMatchObject({
      type: 'url',
      url: '/api/files/outputs/user-1/task-1.png',
    })
  })
})
