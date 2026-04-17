/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger，依赖 @/lib/env
 * [OUTPUT]: 对外提供 ImageGenProcessor 类 (OpenAI 兼容 + Google 图片生成)
 * [POS]: lib/tasks/processors 的图片生成处理器，按 provider 分发到 OpenAI 兼容接口或 Google Imagen
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:image-gen')
const OPENROUTER_IMAGE_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENAI_IMAGE_BASE_URL = 'https://api.openai.com/v1'

interface OpenAICompatibleImageResponse {
  data?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

function toImageDataUrl(base64: string, mimeType = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`
}

function extractOpenAICompatibleImageUrl(
  payload: OpenAICompatibleImageResponse,
): string | null {
  const first = payload.data?.[0]
  if (!first) return null

  if (typeof first.url === 'string' && first.url.trim()) {
    return first.url
  }

  if (typeof first.b64_json === 'string' && first.b64_json.trim()) {
    return toImageDataUrl(first.b64_json.trim())
  }

  return null
}

/* ─── OpenAI-compatible Image API ────────────────────── */

async function openAICompatibleSubmit(
  input: SubmitInput,
  apiKey: string,
  provider: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = (params.prompt as string) ?? ''
  const size = (params.size as string) ?? '1024x1024'
  const baseUrl = resolveOpenAICompatibleBaseUrl(provider, params)

  if (!baseUrl) {
    throw new Error('OpenAI-compatible image provider requires baseUrl')
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, size, n: 1 }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI-compatible image API ${res.status}: ${text}`)
  }

  const data = (await res.json()) as OpenAICompatibleImageResponse
  const url = extractOpenAICompatibleImageUrl(data)
  if (!url) {
    throw new Error(
      'OpenAI-compatible image API returned neither url nor b64_json image data',
    )
  }
  return { url }
}

function resolveOpenAICompatibleBaseUrl(
  provider: string,
  params: Record<string, unknown>,
): string {
  switch (provider) {
    case 'openrouter':
      return OPENROUTER_IMAGE_BASE_URL
    case 'openai':
      return OPENAI_IMAGE_BASE_URL
    case 'openai-compatible':
      return typeof params.baseUrl === 'string'
        ? params.baseUrl.trim().replace(/\/+$/, '')
        : ''
    default:
      return ''
  }
}

/* ─── Google Imagen API ──────────────────────────────── */

async function googleImageSubmit(
  input: SubmitInput,
  apiKey: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = (params.prompt as string) ?? ''

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini Imagen API ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>
  }

  const b64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error('Gemini Imagen returned no image data')

  const mime = data.predictions?.[0]?.mimeType ?? 'image/png'
  return { url: `data:${mime};base64,${b64}` }
}

/* ─── Processor ──────────────────────────────────────── */

export class ImageGenProcessor implements TaskProcessor {
  readonly taskType = 'image_gen' as const
  readonly provider: string

  constructor(provider: string) {
    this.provider = provider
  }

  async submit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
    log.info('Image gen submit', { model: input.model, provider: this.provider })

    let result: { url: string }

    switch (this.provider) {
      case 'openrouter':
      case 'openai':
      case 'openai-compatible':
        result = await openAICompatibleSubmit(input, apiKey, this.provider)
        break
      case 'gemini':
        result = await googleImageSubmit(input, apiKey)
        break
      default:
        throw new Error(`Provider "${this.provider}" not supported for image_gen`)
    }

    // 图片生成是同步的 — 直接用 URL 作为 externalTaskId，checkStatus 返回 completed
    return {
      externalTaskId: result.url,
      initialStatus: 'running',
    }
  }

  async checkStatus(externalTaskId: string, _apiKey: string): Promise<CheckResult> {
    // 同步 Provider: submit 完成即代表 completed，URL 存在 externalTaskId 中
    void _apiKey
    log.debug('Image gen checkStatus (sync)', { provider: this.provider })
    return {
      status: 'completed',
      progress: 100,
      result: {
        type: 'url',
        url: externalTaskId,
        contentType: 'image/png',
      },
    }
  }

  async cancel(_externalTaskId: string, _apiKey: string): Promise<void> {
    void _externalTaskId
    void _apiKey
    log.info('Image gen cancel (noop)', { provider: this.provider })
  }
}
