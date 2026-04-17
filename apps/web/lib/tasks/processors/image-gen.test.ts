/**
 * [INPUT]: 依赖 vitest，依赖 ./image-gen 的 ImageGenProcessor
 * [OUTPUT]: 对外提供图片任务处理器测试 (OpenAI 兼容 url/base64 响应)
 * [POS]: lib/tasks/processors 的回归保护，覆盖图片兼容协议的关键返回体分支
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ImageGenProcessor } from './image-gen'

describe('ImageGenProcessor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('accepts OpenAI-compatible url responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/generated.png' }],
        }),
      } satisfies Partial<Response>),
    )

    const processor = new ImageGenProcessor('openai-compatible')
    const result = await processor.submit(
      {
        model: 'demo-model',
        params: {
          prompt: 'draw a cat',
          baseUrl: 'https://example.com/v1',
        },
      },
      'test-key',
    )

    expect(result.externalTaskId).toBe('https://example.com/generated.png')
    expect(result.initialStatus).toBe('running')
  })

  it('maps platform openrouter image models to the hosted base url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ url: 'https://example.com/platform.png' }],
      }),
    } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('openrouter')
    await processor.submit(
      {
        model: 'openai/dall-e-3',
        params: {
          prompt: 'draw a city',
          size: '1024x1024',
        },
      },
      'platform-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer platform-key',
        }),
      }),
    )
  })

  it('converts OpenAI-compatible b64_json responses into data URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ b64_json: 'ZmFrZS1pbWFnZS1ieXRlcw==' }],
        }),
      } satisfies Partial<Response>),
    )

    const processor = new ImageGenProcessor('openai-compatible')
    const result = await processor.submit(
      {
        model: 'demo-model',
        params: {
          prompt: 'draw a dog',
          baseUrl: 'https://example.com/v1',
        },
      },
      'test-key',
    )

    expect(result.externalTaskId).toBe(
      'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
    )
  })
})
