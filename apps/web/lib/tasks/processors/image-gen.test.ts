/**
 * [INPUT]: 依赖 vitest，依赖 ./image-gen 的 ImageGenProcessor
 * [OUTPUT]: 对外提供图片任务处理器测试 (OpenAI 兼容 url/base64 响应 + 尺寸档位解析)
 * [POS]: lib/tasks/processors 的回归保护，覆盖图片兼容协议的关键返回体分支
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ImageGenProcessor, resolveImageGenerationSize } from './image-gen'

describe('ImageGenProcessor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('accepts OpenAI-compatible url responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ url: 'https://example.com/generated.png' }],
        }),
        text: async () =>
          JSON.stringify({
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
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: [{ url: 'https://example.com/platform.png' }],
      }),
      text: async () =>
        JSON.stringify({
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
        body: JSON.stringify({
          model: 'openai/dall-e-3',
          prompt: 'draw a city',
          size: '1024x1024',
          aspect_ratio: '1:1',
          n: 1,
        }),
      }),
    )
  })

  it('resolves preset size and aspect ratio into concrete dimensions', () => {
    expect(resolveImageGenerationSize('720p', '16:9')).toBe('1280x720')
    expect(resolveImageGenerationSize('1k', '9:16')).toBe('1080x1920')
    expect(resolveImageGenerationSize('2k', '3:2')).toBe('2560x1708')
    expect(resolveImageGenerationSize('4k', '2:3')).toBe('2560x3840')
    expect(resolveImageGenerationSize('8k', '16:9')).toBe('7680x4320')
    expect(resolveImageGenerationSize('1024x1792', '1:1')).toBe('1024x1792')
  })

  it('converts OpenAI-compatible b64_json responses into data URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ b64_json: 'ZmFrZS1pbWFnZS1ieXRlcw==' }],
        }),
        text: async () =>
          JSON.stringify({
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

  it('surfaces html responses as baseUrl configuration errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '<!doctype html><html><body>Wrong endpoint</body></html>',
      } satisfies Partial<Response>),
    )

    const processor = new ImageGenProcessor('openai-compatible')

    await expect(
      processor.submit(
        {
          model: 'demo-model',
          params: {
            prompt: 'draw a fox',
            baseUrl: 'https://example.com',
          },
        },
        'test-key',
      ),
    ).rejects.toThrow(/Check that baseUrl points to an OpenAI-compatible image endpoint/)
  })
})
