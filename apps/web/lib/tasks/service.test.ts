/**
 * [INPUT]: 依赖 vitest，依赖 ./service，依赖 @/services/ai 的 getPlatformKey mock
 * [OUTPUT]: 任务服务测试，覆盖平台前置失败时的错误包装语义
 * [POS]: lib/tasks 的服务层回归测试，防止平台密钥缺失重新退化成 UNKNOWN 500
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorCode, TaskError } from '@/lib/errors'

vi.mock('@/services/ai', () => ({
  getPlatformKey: vi.fn(),
}))

import { getPlatformKey } from '@/services/ai'

import { submitTask } from './service'

function createDbMock(activeCount = 0): D1Database {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ cnt: activeCount }),
      }),
    }),
  } as unknown as D1Database
}

describe('submitTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
