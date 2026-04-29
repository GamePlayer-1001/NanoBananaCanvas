/**
 * [INPUT]: 依赖 vitest，依赖 ./image-gen 的 ImageGenProcessor
 * [OUTPUT]: 对外提供图片任务处理器测试 (OpenAI 兼容 url/base64 响应 + 尺寸档位解析)
 * [POS]: lib/tasks/processors 的回归保护，覆盖图片兼容协议的关键返回体分支
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  assertOpenAICompatiblePromptSafety,
  ImageGenProcessor,
  normalizeImagePromptForApi,
  resolveImageGenerationSize,
  resolveOpenAICompatibleRequestSize,
} from './image-gen'

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

    expect(result.externalTaskId).toBeNull()
    expect(result.initialStatus).toBe('completed')
    expect(result.result).toEqual({
      type: 'url',
      url: 'https://example.com/generated.png',
      contentType: 'image/png',
    })
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

  it('flattens formatted prompts before sending them to the image api', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: [{ url: 'https://example.com/flat.png' }],
      }),
      text: async () =>
        JSON.stringify({
          data: [{ url: 'https://example.com/flat.png' }],
        }),
    } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('openai-compatible')
    await processor.submit(
      {
        model: 'demo-model',
        params: {
          prompt: '角色设定：\n- 男孩\n- 背带裤\t\t- 篮球场',
          baseUrl: 'https://example.com/v1',
        },
      },
      'test-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/images/generations',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'demo-model',
          prompt: '角色设定： - 男孩 - 背带裤 - 篮球场',
          size: '1920x1920',
          aspect_ratio: '1:1',
          n: 1,
        }),
      }),
    )
  })

  it('resolves preset size and aspect ratio into concrete dimensions', () => {
    expect(resolveImageGenerationSize('auto', '16:9')).toBe('1920x1080')
    expect(resolveImageGenerationSize('720p', '16:9')).toBe('1280x720')
    expect(resolveImageGenerationSize('1k', '9:16')).toBe('1080x1920')
    expect(resolveImageGenerationSize('2k', '3:2')).toBe('2560x1708')
    expect(resolveImageGenerationSize('4k', '2:3')).toBe('2560x3840')
    expect(resolveImageGenerationSize('8k', '16:9')).toBe('7680x4320')
    expect(resolveImageGenerationSize('1024x1792', '1:1')).toBe('1024x1792')
  })

  it('preserves auto size for OpenAI-compatible image requests', () => {
    expect(resolveOpenAICompatibleRequestSize('auto', '16:9')).toBe('auto')
    expect(resolveOpenAICompatibleRequestSize('1k', '16:9')).toBe('1920x1080')
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

    expect(result.externalTaskId).toBeNull()
    expect(result.initialStatus).toBe('completed')
    expect(result.result).toEqual({
      type: 'url',
      url: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
      contentType: 'image/png',
    })
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

  it('blocks oversized OpenAI-compatible prompts before the gateway request is sent', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('openai-compatible')
    const prompt = '超长提示词'.repeat(1000)

    await expect(
      processor.submit(
        {
          model: 'demo-model',
          params: {
            prompt,
            baseUrl: 'http://www.1314mc.net:3333/v1',
          },
        },
        'test-key',
      ),
    ).rejects.toThrow(/Long prompts sent to http:\/\/www\.1314mc\.net:3333 are prone to upstream 524 timeouts/)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows prompts within the safety guard limits', () => {
    expect(() =>
      assertOpenAICompatiblePromptSafety(
        '生成一张在户外打篮球的男孩照片',
        'https://example.com/v1',
      ),
    ).not.toThrow()
  })

  it('normalizes multiline prompts into a single blob string', () => {
    expect(
      normalizeImagePromptForApi('第一段\n\n第二段\t第三段   第四段'),
    ).toBe('第一段 第二段 第三段 第四段')
  })
})
