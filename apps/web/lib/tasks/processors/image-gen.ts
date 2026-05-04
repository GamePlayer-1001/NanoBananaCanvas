/**
 * [INPUT]: 依赖 ./types 的 TaskProcessor 接口，依赖 @/lib/logger，依赖 @/lib/image-model-capabilities
 * [OUTPUT]: 对外提供 ImageGenProcessor 类（OpenAI 兼容 + Google 图片生成 + DLAPI 异步出图）
 * [POS]: lib/tasks/processors 的图片生成处理器，负责平台图片主链、托底切流与统一图片能力护栏
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
const COMFLY_IMAGE_BASE_URL = 'https://ai.comfly.chat/v1'
const DLAPI_IMAGE_BASE_URL = 'https://api.dlapi.xyz/v1'
const OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_CHARS = 3500
const OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_BYTES = 10_000

type DlapiTaskStatus = 'queued' | 'running' | 'completed' | 'failed'

interface DlapiImageTaskCreateResponse {
  id?: string
  status?: DlapiTaskStatus
  model?: string
}

interface DlapiImageTaskCheckResponse {
  id?: string
  status?: DlapiTaskStatus
  model?: string
  progress?: number
  message?: string
  data?: Array<{
    url?: string
    b64_json?: string
  }>
  error?: {
    message?: string
    code?: string
  }
}

interface OpenAICompatibleImageResponse {
  data?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

interface OpenRouterChatImageResponse {
  choices?: Array<{
    message?: {
      images?: Array<{
        image_url?: {
          url?: string
        }
      }>
    }
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

function extractOpenRouterChatImageUrl(
  payload: OpenRouterChatImageResponse,
): string | null {
  const first = payload.choices?.[0]?.message?.images?.[0]?.image_url?.url
  return typeof first === 'string' && first.trim() ? first.trim() : null
}

function readReferenceImageUrl(params: Record<string, unknown>): string | undefined {
  const raw = params.imageUrl
  if (typeof raw !== 'string') {
    return undefined
  }

  const value = raw.trim()
  return value ? value : undefined
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

function isRetriableImageProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('524') ||
    message.includes('522') ||
    message.includes('520') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('upstream') ||
    message.includes('gateway')
  )
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
  _provider: string,
  sizePreset: string,
  aspectRatio: string,
): string {
  if (sizePreset === 'auto') {
    return 'auto'
  }

  return resolveImageGenerationSize(sizePreset, aspectRatio)
}

function shouldUseOpenRouterChatImageApi(provider: string, model: string): boolean {
  return provider === 'openrouter' && /^openai\/gpt-.*image/i.test(model)
}

async function parseJsonResponse<T>(
  res: Response,
  errorPrefix: string,
): Promise<T> {
  const contentType = res.headers.get('content-type') ?? ''
  const rawBody = await res.text().catch(() => '')

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `${errorPrefix} returned non-JSON content (${contentType || 'unknown content type'}). ` +
        `Check that baseUrl points to an OpenAI-compatible image endpoint. ` +
        `Response preview: ${summarizeResponseBody(rawBody)}`,
    )
  }

  try {
    return JSON.parse(rawBody) as T
  } catch {
    throw new Error(
      `${errorPrefix} returned invalid JSON. ` +
        `Check that baseUrl points to an OpenAI-compatible image endpoint. ` +
        `Response preview: ${summarizeResponseBody(rawBody)}`,
    )
  }
}

async function openRouterChatImageSubmit(
  input: SubmitInput,
  apiKey: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const referenceImageUrl = readReferenceImageUrl(params)
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const baseUrl = resolveOpenAICompatibleBaseUrl('openrouter', params)
  const imageConfig =
    sizePreset === 'auto'
      ? { aspect_ratio: aspectRatio }
      : { aspect_ratio: aspectRatio, image_size: sizePreset }

  assertOpenAICompatiblePromptSafety(prompt, baseUrl)

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: referenceImageUrl
            ? [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: referenceImageUrl } },
              ]
            : prompt,
        },
      ],
      modalities: ['image', 'text'],
      image_config: imageConfig,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(buildGatewayFailureMessage(res.status, 'openrouter', baseUrl, text))
    }
    throw new Error(`OpenRouter chat image API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<OpenRouterChatImageResponse>(
    res,
    'OpenRouter chat image API',
  )
  const url = extractOpenRouterChatImageUrl(data)

  if (!url) {
    throw new Error(
      'OpenRouter chat image API returned no assistant image data',
    )
  }

  return { url }
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
  const referenceImageUrl = readReferenceImageUrl(params)
  const capabilities = readImageCapabilities(params)
  const violation = validateImageSelection(sizePreset, aspectRatio, capabilities)

  if (violation) {
    throw new Error(violation.message)
  }

  const size = resolveOpenAICompatibleRequestSize(provider, sizePreset, aspectRatio)
  const baseUrl = resolveOpenAICompatibleBaseUrl(provider, params)

  if (!baseUrl) {
    throw new Error('OpenAI-compatible image provider requires baseUrl')
  }

  assertOpenAICompatiblePromptSafety(prompt, baseUrl)

  if (provider === 'openrouter' && referenceImageUrl) {
    return openRouterChatImageSubmit(input, apiKey)
  }

  if (shouldUseOpenRouterChatImageApi(provider, model)) {
    return openRouterChatImageSubmit(input, apiKey)
  }

  const requestPath = referenceImageUrl ? '/images/edits' : '/images/generations'
  const requestBody = referenceImageUrl
    ? {
        model,
        prompt,
        size,
        images: [{ image_url: referenceImageUrl }],
        n: 1,
      }
    : { model, prompt, size, aspect_ratio: aspectRatio, n: 1 }

  const res = await fetch(`${baseUrl}${requestPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(buildGatewayFailureMessage(res.status, provider, `${baseUrl}${requestPath}`, text))
    }
    throw new Error(`OpenAI-compatible image API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<OpenAICompatibleImageResponse>(
    res,
    'OpenAI-compatible image API',
  )

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
    case 'comfly':
      return COMFLY_IMAGE_BASE_URL
    default:
      return ''
  }
}

async function dlapiSubmit(
  input: SubmitInput,
  apiKey: string,
): Promise<SubmitResult> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const referenceImageUrl = readReferenceImageUrl(params)
  const capabilities = readImageCapabilities(params)
  const violation = validateImageSelection(sizePreset, aspectRatio, capabilities)

  if (violation) {
    throw new Error(violation.message)
  }

  if (referenceImageUrl) {
    throw new Error(
      'DLAPI 图片生成链路当前还未接通参考图编辑协议，已阻止静默忽略 image input；请先切换到 OpenAI/OpenRouter 兼容图片模型。',
    )
  }

  const size = resolveOpenAICompatibleRequestSize('dlapi', sizePreset, aspectRatio)
  const res = await fetch(`${DLAPI_IMAGE_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      async: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DLAPI image API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<DlapiImageTaskCreateResponse>(
    res,
    'DLAPI image API',
  )

  if (!data.id) {
    throw new Error('DLAPI image API returned no task id')
  }

  return {
    externalTaskId: data.id,
    initialStatus: data.status === 'completed' ? 'completed' : 'running',
  }
}

async function dlapiCheckStatus(
  externalTaskId: string,
  apiKey: string,
): Promise<CheckResult> {
  const res = await fetch(`${DLAPI_IMAGE_BASE_URL}/images/generations/${externalTaskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DLAPI image status API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<DlapiImageTaskCheckResponse>(
    res,
    'DLAPI image status API',
  )

  if (data.status === 'failed') {
    return {
      status: 'failed',
      progress: 0,
      error: data.error?.message ?? data.message ?? 'DLAPI image generation failed',
    }
  }

  if (data.status === 'completed') {
    const url = extractOpenAICompatibleImageUrl({
      data: data.data?.map((item) => ({
        url: item.url,
        b64_json: item.b64_json,
      })),
    })

    if (!url) {
      return {
        status: 'failed',
        progress: 100,
        error: 'DLAPI image generation completed without image payload',
      }
    }

    return {
      status: 'completed',
      progress: 100,
      result: {
        type: 'url',
        url,
        contentType: inferImageContentType(url),
      },
    }
  }

  return {
    status: 'running',
    progress:
      typeof data.progress === 'number'
        ? Math.max(0, Math.min(99, Math.round(data.progress)))
        : data.status === 'queued'
          ? 5
          : 50,
  }
}

async function submitWithComflyFallback(
  input: SubmitInput,
  apiKey: string,
): Promise<SubmitResult> {
  try {
    return await dlapiSubmit(input, apiKey)
  } catch (error) {
    if (!isRetriableImageProviderError(error)) {
      throw error
    }

    log.warn('DLAPI image submit failed, fallback to Comfly', {
      error: error instanceof Error ? error.message : String(error),
      model: input.model,
    })

    const result = await openAICompatibleSubmit(input, apiKey, 'comfly')
    return {
      externalTaskId: null,
      initialStatus: 'completed',
      result: {
        type: 'url',
        url: result.url,
        contentType: inferImageContentType(result.url),
      },
      providerOverride: 'comfly',
      modelOverride: input.model,
    }
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
  const referenceImageUrl = readReferenceImageUrl(params)
  const capabilities = readImageCapabilities(params)
  const violation = validateImageSelection(sizePreset, aspectRatio, capabilities)

  if (violation) {
    throw new Error(violation.message)
  }

  if (referenceImageUrl) {
    throw new Error(
      '当前 Gemini/Imagen 提交实现仅接通了文生图接口，尚未接通参考图编辑请求；已阻止静默忽略 image input。',
    )
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
        return {
          externalTaskId: null,
          initialStatus: 'completed',
          result: {
            type: 'url',
            url: result.url,
            contentType: inferImageContentType(result.url),
          },
        }
      case 'comfly':
        result = await openAICompatibleSubmit(input, apiKey, this.provider)
        return {
          externalTaskId: null,
          initialStatus: 'completed',
          result: {
            type: 'url',
            url: result.url,
            contentType: inferImageContentType(result.url),
          },
        }
      case 'dlapi':
        return submitWithComflyFallback(input, apiKey)
      case 'gemini':
        result = await googleImageSubmit(input, apiKey)
        return {
          externalTaskId: null,
          initialStatus: 'completed',
          result: {
            type: 'url',
            url: result.url,
            contentType: inferImageContentType(result.url),
          },
        }
      default:
        throw new Error(`Provider "${this.provider}" not supported for image_gen`)
    }
  }

  async checkStatus(externalTaskId: string, _apiKey: string): Promise<CheckResult> {
    if (this.provider === 'dlapi') {
      return dlapiCheckStatus(externalTaskId, _apiKey)
    }

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
