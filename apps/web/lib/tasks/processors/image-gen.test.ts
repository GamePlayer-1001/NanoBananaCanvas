/**
 * [INPUT]: 依赖 vitest，依赖 ./image-gen 的 ImageGenProcessor
 * [OUTPUT]: 对外提供图片任务处理器测试（OpenAI 兼容 / DLAPI 异步 / Comfly 托底）
 * [POS]: lib/tasks/processors 的回归保护，覆盖平台图片主链的关键协议分支
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

  it('uses OpenRouter chat completions for gpt image models', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                images: [
                  {
                    image_url: {
                      url: 'data:image/png;base64,b3BlbnJvdXRlci1pbWFnZQ==',
                    },
                  },
                ],
              },
            },
          ],
        }),
    } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('openrouter')
    const result = await processor.submit(
      {
        model: 'openai/gpt-5.4-image-2',
        params: {
          prompt: 'draw a city skyline at sunrise',
          size: 'auto',
          aspectRatio: '16:9',
        },
      },
      'platform-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer platform-key',
        }),
        body: JSON.stringify({
          model: 'openai/gpt-5.4-image-2',
          messages: [
            {
              role: 'user',
              content: 'draw a city skyline at sunrise',
            },
          ],
          modalities: ['image', 'text'],
          image_config: {
            aspect_ratio: '16:9',
          },
        }),
      }),
    )
    expect(result.result).toEqual({
      type: 'url',
      url: 'data:image/png;base64,b3BlbnJvdXRlci1pbWFnZQ==',
      contentType: 'image/png',
    })
  })

  it('passes reference image to OpenRouter chat image requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                images: [
                  {
                    image_url: {
                      url: 'https://example.com/edited.png',
                    },
                  },
                ],
              },
            },
          ],
        }),
    } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('openrouter')
    await processor.submit(
      {
        model: 'openai/dall-e-3',
        params: {
          prompt: '基于参考图增强光影',
          size: '1k',
          aspectRatio: '1:1',
          imageUrl: 'https://example.com/reference.png',
        },
      },
      'platform-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'openai/dall-e-3',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: '基于参考图增强光影' },
                {
                  type: 'image_url',
                  image_url: { url: 'https://example.com/reference.png' },
                },
              ],
            },
          ],
          modalities: ['image', 'text'],
          image_config: {
            aspect_ratio: '1:1',
            image_size: '1k',
          },
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

  it('submits image edits when an OpenAI-compatible reference image is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: [{ url: 'https://example.com/edited-openai-compatible.png' }],
      }),
      text: async () =>
        JSON.stringify({
          data: [{ url: 'https://example.com/edited-openai-compatible.png' }],
        }),
    } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('openai-compatible')
    await processor.submit(
      {
        model: 'demo-model',
        params: {
          prompt: '保留主体，重绘背景',
          baseUrl: 'https://example.com/v1',
          size: '1024x1024',
          imageUrl: 'https://example.com/source.png',
        },
      },
      'test-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/images/edits',
      expect.objectContaining({
        body: JSON.stringify({
          model: 'demo-model',
          prompt: '保留主体，重绘背景',
          size: '1024x1024',
          images: [{ image_url: 'https://example.com/source.png' }],
          n: 1,
        }),
      }),
    )
  })

  it('resolves preset size and aspect ratio into concrete dimensions', () => {
    expect(resolveImageGenerationSize('auto', '16:9')).toBe('1920x1080')
    expect(resolveImageGenerationSize('1k', '9:16')).toBe('1080x1920')
    expect(resolveImageGenerationSize('2k', '3:2')).toBe('2560x1708')
    expect(resolveImageGenerationSize('4k', '2:3')).toBe('2560x3840')
    expect(resolveImageGenerationSize('8k', '16:9')).toBe('7680x4320')
    expect(resolveImageGenerationSize('1024x1792', '1:1')).toBe('1024x1792')
  })

  it('preserves auto size for image requests across providers', () => {
    expect(resolveOpenAICompatibleRequestSize('openrouter', 'auto', '16:9')).toBe('auto')
    expect(resolveOpenAICompatibleRequestSize('openai', 'auto', '16:9')).toBe('auto')
    expect(resolveOpenAICompatibleRequestSize('openai-compatible', 'auto', '16:9')).toBe('auto')
    expect(resolveOpenAICompatibleRequestSize('dlapi', 'auto', '16:9')).toBe('auto')
    expect(resolveOpenAICompatibleRequestSize('openai-compatible', '1k', '16:9')).toBe('1920x1080')
  })

  it('submits dlapi image tasks in async mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () =>
        JSON.stringify({
          id: 'imgjob_123',
          status: 'running',
        }),
    } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('dlapi')
    const result = await processor.submit(
      {
        model: 'gpt-image-2',
        params: {
          prompt: 'draw a white cat',
          size: '1024x1024',
        },
      },
      'platform-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.dlapi.xyz/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'gpt-image-2',
          prompt: 'draw a white cat',
          size: '1024x1024',
          async: true,
        }),
      }),
    )
    expect(result).toMatchObject({
      externalTaskId: 'imgjob_123',
      initialStatus: 'running',
    })
  })

  it('falls back from dlapi to comfly on gateway-like failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 524,
        text: async () => 'upstream timed out',
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () =>
          JSON.stringify({
            data: [{ url: 'https://example.com/comfly.png' }],
          }),
      } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('dlapi')
    const result = await processor.submit(
      {
        model: 'gpt-image-2',
        params: {
          prompt: 'draw a fallback cat',
          size: '1024x1024',
        },
      },
      'platform-key',
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://ai.comfly.chat/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(result).toMatchObject({
      initialStatus: 'completed',
      providerOverride: 'comfly',
      modelOverride: 'gpt-image-2',
      result: {
        type: 'url',
        url: 'https://example.com/comfly.png',
      },
    })
  })

  it('submits dlapi image edits as multipart form data when a reference image is provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        blob: async () => new Blob(['fake-image'], { type: 'image/png' }),
      } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () =>
          JSON.stringify({
            id: 'imgjob_edit_123',
            status: 'running',
          }),
      } satisfies Partial<Response>)
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('dlapi')
    const result = await processor.submit(
      {
        model: 'gpt-image-2',
        params: {
          prompt: '参考原图进行重绘',
          imageUrl: 'https://example.com/reference.png',
          size: '1024x1024',
        },
      },
      'platform-key',
    )

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://example.com/reference.png')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.dlapi.xyz/v1/images/edits',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer platform-key',
        }),
        body: expect.any(FormData),
      }),
    )

    const secondCall = fetchMock.mock.calls[1]
    const requestInit = secondCall?.[1] as RequestInit
    const formData = requestInit.body as FormData
    expect(formData.get('model')).toBe('gpt-image-2')
    expect(formData.get('prompt')).toBe('参考原图进行重绘')
    expect(formData.get('size')).toBe('1024x1024')
    expect(formData.get('n')).toBe('1')
    expect(formData.get('async')).toBe('true')
    expect(formData.get('image')).toBeInstanceOf(File)
    expect(result).toMatchObject({
      externalTaskId: 'imgjob_edit_123',
      initialStatus: 'running',
    })
  })

  it('checks dlapi async task completion and returns image data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () =>
          JSON.stringify({
            id: 'imgjob_123',
            status: 'completed',
            data: [{ b64_json: 'ZmFrZS1kbGFwaS1pbWFnZQ==' }],
          }),
      } satisfies Partial<Response>),
    )

    const processor = new ImageGenProcessor('dlapi')
    const result = await processor.checkStatus('imgjob_123', 'platform-key')

    expect(result).toEqual({
      status: 'completed',
      progress: 100,
      result: {
        type: 'url',
        url: 'data:image/png;base64,ZmFrZS1kbGFwaS1pbWFnZQ==',
        contentType: 'image/png',
      },
    })
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

  it('fails fast when gemini receives a reference image it cannot actually use', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const processor = new ImageGenProcessor('gemini')

    await expect(
      processor.submit(
        {
          model: 'imagen-3.0-generate-002',
          params: {
            prompt: '参考原图做风格化重绘',
            imageUrl: 'https://example.com/reference.png',
          },
        },
        'test-key',
      ),
    ).rejects.toThrow(/尚未接通参考图编辑请求/)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
