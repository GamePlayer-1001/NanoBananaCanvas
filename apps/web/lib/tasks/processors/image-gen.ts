/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger，依赖 @/lib/image-model-capabilities
 * [OUTPUT]: 对外提供 ImageGenProcessor 类 (OpenAI 兼容 + Google 图片生成)
 * [POS]: lib/tasks/processors 的图片生成处理器，按 provider 分发到 OpenAI 兼容接口或 Google Imagen，并复用统一图片能力护栏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  resolveImageGenerationSize,
  validateImageSelection,
  type ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
import { createLogger } from '@/lib/logger'

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'

const log = createLogger('processor:image-gen')
const OPENROUTER_IMAGE_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENAI_IMAGE_BASE_URL = 'https://api.openai.com/v1'
const OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_CHARS = 3500
const OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_BYTES = 10_000

interface OpenAICompatibleImageResponse {
  data?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

function summarizeResponseBody(body: string, maxLength = 160): string {
  const normalized = body.replace(/\s+/g, ' ').trim()
  if (!normalized) return '(empty response body)'
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized
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

function readImageCapabilities(params: Record<string, unknown>): ImageModelCapabilities | undefined {
  const raw = params.imageCapabilities
  return raw && typeof raw === 'object'
    ? (raw as ImageModelCapabilities)
    : undefined
}

function summarizeBaseUrl(baseUrl: string): string {
  try {
    const parsed = new URL(baseUrl)
    return parsed.origin
  } catch {
    return baseUrl
  }
}

function buildGatewayFailureMessage(
  status: number,
  provider: string,
  baseUrl: string,
  body: string,
): string {
  const endpoint = summarizeBaseUrl(baseUrl)
  const preview = summarizeResponseBody(body)

  return (
    `OpenAI-compatible image API ${status} from ${endpoint}: ${preview}. ` +
    `This usually means the upstream compatible gateway timed out or failed before returning image data, ` +
    `not that the local workflow worker timed out. Provider=${provider}.`
  )
}

function measurePromptSize(prompt: string): { chars: number; bytes: number } {
  return {
    chars: prompt.length,
    bytes: new TextEncoder().encode(prompt).length,
  }
}

function buildPromptTooLongMessage(baseUrl: string, chars: number, bytes: number): string {
  const endpoint = summarizeBaseUrl(baseUrl)
  return (
    `OpenAI-compatible image prompt is too large for the current gateway safety guard ` +
    `(${chars} chars / ${bytes} bytes, limit ${OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_CHARS} chars ` +
    `or ${OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_BYTES} bytes). ` +
    `Long prompts sent to ${endpoint} are prone to upstream 524 timeouts while the real image provider may still bill the request. ` +
    `Shorten the prompt or switch this image node to a provider with a more reliable image endpoint.`
  )
}

export function normalizeImagePromptForApi(prompt: string): string {
  return prompt.replace(/\s+/g, ' ').trim()
}

export function assertOpenAICompatiblePromptSafety(prompt: string, baseUrl: string): void {
  const { chars, bytes } = measurePromptSize(prompt)
  if (
    chars <= OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_CHARS &&
    bytes <= OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_BYTES
  ) {
    return
  }

  throw new Error(buildPromptTooLongMessage(baseUrl, chars, bytes))
}

function resolveOpenAICompatibleRequestSize(
  sizePreset: string,
  aspectRatio: string,
): string {
  if (sizePreset === 'auto') {
    return 'auto'
  }

  return resolveImageGenerationSize(sizePreset, aspectRatio)
}

/* ─── OpenAI-compatible Image API ────────────────────── */

async function openAICompatibleSubmit(
  input: SubmitInput,
  apiKey: string,
  provider: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const capabilities = readImageCapabilities(params)
  const violation = validateImageSelection(sizePreset, aspectRatio, capabilities)

  if (violation) {
    throw new Error(violation.message)
  }

  const size = resolveOpenAICompatibleRequestSize(sizePreset, aspectRatio)
  const baseUrl = resolveOpenAICompatibleBaseUrl(provider, params)

  if (!baseUrl) {
    throw new Error('OpenAI-compatible image provider requires baseUrl')
  }

  assertOpenAICompatiblePromptSafety(prompt, baseUrl)

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, size, aspect_ratio: aspectRatio, n: 1 }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(buildGatewayFailureMessage(res.status, provider, baseUrl, text))
    }
    throw new Error(`OpenAI-compatible image API ${res.status}: ${text}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  const rawBody = await res.text().catch(() => '')

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `OpenAI-compatible image API returned non-JSON content (${contentType || 'unknown content type'}). ` +
        `Check that baseUrl points to an OpenAI-compatible image endpoint. ` +
        `Response preview: ${summarizeResponseBody(rawBody)}`,
    )
  }

  let data: OpenAICompatibleImageResponse
  try {
    data = JSON.parse(rawBody) as OpenAICompatibleImageResponse
  } catch {
    throw new Error(
      `OpenAI-compatible image API returned invalid JSON. ` +
        `Check that baseUrl points to an OpenAI-compatible image endpoint. ` +
        `Response preview: ${summarizeResponseBody(rawBody)}`,
    )
  }

  const url = extractOpenAICompatibleImageUrl(data)
  if (!url) {
    throw new Error(
      'OpenAI-compatible image API returned neither url nor b64_json image data',
    )
  }
  return { url }
}

function statusIsGatewayLikeFailure(status: number): boolean {
  return [502, 503, 504, 520, 522, 524].includes(status)
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
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const capabilities = readImageCapabilities(params)
  const violation = validateImageSelection(sizePreset, aspectRatio, capabilities)

  if (violation) {
    throw new Error(violation.message)
  }

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

    return {
      externalTaskId: null,
      initialStatus: 'completed',
      result: {
        type: 'url',
        url: result.url,
        contentType: inferImageContentType(result.url),
      },
    }
  }

  async checkStatus(externalTaskId: string, _apiKey: string): Promise<CheckResult> {
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

function inferImageContentType(url: string): string {
  if (url.startsWith('data:image/')) {
    const match = /^data:([^;,]+)/i.exec(url)
    return match?.[1] ?? 'image/png'
  }

  if (/\.jpe?g($|\?)/i.test(url)) return 'image/jpeg'
  if (/\.webp($|\?)/i.test(url)) return 'image/webp'
  if (/\.gif($|\?)/i.test(url)) return 'image/gif'
  return 'image/png'
}

export { resolveImageGenerationSize, resolveOpenAICompatibleRequestSize }
