/**
 * [INPUT]: 依赖 @/lib/image-model-capabilities, @/lib/logger, @/lib/seo, @/lib/storage
 * [OUTPUT]: 对外提供图片生成处理器的类型定义、常量、通用工具函数
 * [POS]: lib/tasks/processors 的图片生成辅助层，从 image-gen.ts 拆出的纯函数与类型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  resolveImageGenerationSize,
  validateImageSelection,
  type ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
import { createLogger } from '@/lib/logger'
import { BASE_URL } from '@/lib/seo'
import { extractR2KeyFromFileUrl } from '@/lib/storage'

import type { SubmitInput } from './types'

export const log = createLogger('processor:image-gen')
export const OPENROUTER_IMAGE_BASE_URL = 'https://openrouter.ai/api/v1'
export const OPENAI_IMAGE_BASE_URL = 'https://api.openai.com/v1'
export const COMFLY_IMAGE_BASE_URL = 'https://ai.comfly.chat/v1'
export const DLAPI_IMAGE_BASE_URL = 'https://api.dlapi.xyz/v1'
export const OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_CHARS = 3500
export const OPENAI_COMPATIBLE_IMAGE_PROMPT_MAX_BYTES = 10_000

/* ─── Types ──────────────────────────────────────────── */

export interface DlapiImageTaskCheckResponse {
  status?: 'queued' | 'running' | 'completed' | 'failed'
  id?: string
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

export interface OpenAICompatibleImageResponse {
  data?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

export interface ChatCompletionsImageContentPart {
  type?: string
  text?: string
  image_url?: {
    url?: string
  }
}

export interface ChatCompletionsImageResponse {
  choices?: Array<{
    message?: {
      content?: string | ChatCompletionsImageContentPart[]
      images?: Array<{
        image_url?: {
          url?: string
        }
      }>
    }
  }>
}

export type OpenRouterChatImageResponse = ChatCompletionsImageResponse

export interface DlapiFailureDiagnostics extends Record<string, unknown> {
  stage: 'submit'
  requestedProvider: 'dlapi'
  requestedModel: string
  fallbackProvider: 'comfly'
  fallbackModel: string
  endpoint: string
  status?: number
  responsePreview?: string
  errorMessage: string
  failureKind:
    | 'gateway'
    | 'auth'
    | 'empty_payload'
    | 'non_json'
    | 'invalid_json'
    | 'direct_response'
    | 'other'
  sizePreset: string
  resolvedSize: string
  aspectRatio: string
  hasReferenceImage: boolean
  elapsedMs?: number
}

export const IMAGE_PROVIDER_FALLBACK_MODEL_MAP: Record<string, Record<string, string>> = {
  dlapi: {
    'gpt-image-2': 'gpt-image-2-all',
    'gemini-3.1-flash-image-preview': 'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview': 'nano-banana-pro',
    'nano-banana': 'nano-banana',
  },
}

/* ─── Generic Helpers ────────────────────────────────── */

export function summarizeResponseBody(body: string, maxLength = 160): string {
  const normalized = body.replace(/\s+/g, ' ').trim()
  if (!normalized) return '(empty response body)'
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized
}

export function toImageDataUrl(base64: string, mimeType = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`
}

export function extractOpenAICompatibleImageUrl(
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

export function extractOpenRouterChatImageUrl(
  payload: OpenRouterChatImageResponse,
): string | null {
  return extractChatCompletionsImageUrl(payload)
}

const MARKDOWN_IMAGE_URL_REGEX = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/i
const STANDALONE_IMAGE_URL_REGEX =
  /https?:\/\/[^\s)\]'"<>]+\.(?:png|jpe?g|gif|webp|bmp)(?:\?[^\s)\]'"<>]*)?/i
const DATA_IMAGE_URL_REGEX = /data:image\/[\w+.-]+;base64,[A-Za-z0-9+/=]+/i

export function extractChatCompletionsImageUrl(
  payload: ChatCompletionsImageResponse,
): string | null {
  const message = payload.choices?.[0]?.message
  if (!message) return null

  const fromImagesArray = message.images?.[0]?.image_url?.url
  if (typeof fromImagesArray === 'string' && fromImagesArray.trim()) {
    return fromImagesArray.trim()
  }

  const content = message.content
  if (Array.isArray(content)) {
    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      const partUrl = part.image_url?.url
      if (typeof partUrl === 'string' && partUrl.trim()) {
        return partUrl.trim()
      }
    }

    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      if (typeof part.text === 'string') {
        const fromText = extractImageUrlFromText(part.text)
        if (fromText) return fromText
      }
    }

    return null
  }

  if (typeof content === 'string') {
    return extractImageUrlFromText(content)
  }

  return null
}

function extractImageUrlFromText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const dataMatch = DATA_IMAGE_URL_REGEX.exec(trimmed)
  if (dataMatch) {
    return dataMatch[0]
  }

  const markdownMatch = MARKDOWN_IMAGE_URL_REGEX.exec(trimmed)
  if (markdownMatch?.[1]) {
    return markdownMatch[1].trim()
  }

  const directMatch = STANDALONE_IMAGE_URL_REGEX.exec(trimmed)
  if (directMatch) {
    return directMatch[0]
  }

  return null
}

export function readReferenceImageUrl(params: Record<string, unknown>): string | undefined {
  const raw = params.imageUrl
  if (typeof raw !== 'string') {
    return undefined
  }

  const value = raw.trim()
  if (!value) {
    return undefined
  }

  if (value.startsWith('data:')) {
    return value
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  if (value.startsWith('/')) {
    return new URL(value, BASE_URL).toString()
  }

  return value
}

export function readImageCapabilities(params: Record<string, unknown>): ImageModelCapabilities | undefined {
  const raw = params.imageCapabilities
  return raw && typeof raw === 'object'
    ? (raw as ImageModelCapabilities)
    : undefined
}

export function inferExtensionFromMimeType(mimeType: string | null): string {
  switch ((mimeType ?? '').toLowerCase()) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'png'
  }
}

export function resolveInternalReferenceImageR2Key(imageUrl: string): string | null {
  const directKey = extractR2KeyFromFileUrl(imageUrl)
  if (directKey) {
    return directKey
  }

  try {
    const parsed = new URL(imageUrl)
    if (parsed.origin !== new URL(BASE_URL).origin) {
      return null
    }

    return extractR2KeyFromFileUrl(parsed.pathname)
  } catch {
    return null
  }
}

export async function loadInternalReferenceImageAssetViaWebRuntime(
  r2Key: string,
): Promise<{ blob: Blob; filename: string }> {
  const { getR2 } = await import('@/lib/r2')
  const r2 = await getR2()
  const object = await r2.get(r2Key)

  if (!object) {
    throw new Error(`Reference image not found in internal storage: ${r2Key}`)
  }

  const buffer = await object.arrayBuffer()
  const mimeType = object.httpMetadata?.contentType ?? 'image/png'
  const extension = inferExtensionFromMimeType(mimeType)

  return {
    blob: new Blob([buffer], { type: mimeType }),
    filename: `reference.${extension}`,
  }
}

export async function fetchReferenceImageAsset(
  imageUrl: string,
  loadInternalReferenceImageAsset?: (
    r2Key: string,
  ) => Promise<{ blob: Blob; filename: string }>,
): Promise<{ blob: Blob; filename: string }> {
  const internalR2Key = resolveInternalReferenceImageR2Key(imageUrl)
  if (internalR2Key) {
    const loader = loadInternalReferenceImageAsset ?? loadInternalReferenceImageAssetViaWebRuntime
    return loader(internalR2Key)
  }

  const res = await fetch(imageUrl)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch reference image ${res.status}: ${text}`)
  }

  const blob = await res.blob()
  const mimeType = blob.type || res.headers.get('content-type')
  const extension = inferExtensionFromMimeType(mimeType)

  return {
    blob,
    filename: `reference.${extension}`,
  }
}

export async function buildMultipartImageEditRequestInit(
  apiKey: string,
  model: string,
  prompt: string,
  size: string,
  referenceImageUrl: string,
  loadInternalReferenceImageAsset?: (
    r2Key: string,
  ) => Promise<{ blob: Blob; filename: string }>,
): Promise<RequestInit> {
  const { blob, filename } = await fetchReferenceImageAsset(
    referenceImageUrl,
    loadInternalReferenceImageAsset,
  )
  const formData = new FormData()
  formData.append('model', model)
  formData.append('prompt', prompt)
  formData.append('size', size)
  formData.append('n', '1')
  formData.append('image', blob, filename)

  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  }
}

export function summarizeBaseUrl(baseUrl: string): string {
  try {
    const parsed = new URL(baseUrl)
    return parsed.origin
  } catch {
    return baseUrl
  }
}

export function isRetriableImageProviderError(error: unknown): boolean {
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

export function buildGatewayFailureMessage(
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

export function isDlapiAsyncProtocolError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('dlapi async image protocol') ||
    message.includes('dlapi image api returned no task id')
  )
}

export function isDlapiDirectResponseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('dlapi image api') ||
    message.includes('check that baseurl points to an openai-compatible image endpoint') ||
    message.includes('returned neither url nor b64_json image data') ||
    message.includes('returned invalid json') ||
    message.includes('returned non-json content')
  )
}

export function isDlapiAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('dlapi image api 401') ||
    (message.includes('invalid token') && message.includes('dlapi')) ||
    (message.includes('无效的令牌') && message.includes('dlapi'))
  )
}

export function buildDlapiAuthFallbackFailureMessage(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error)
  return (
    `DLAPI image provider authentication failed and no Comfly fallback key was available. ` +
    `Check DLAPI_API_KEY or configure COMFLY_API_KEY as the platform image fallback. ` +
    `Upstream detail: ${detail}`
  )
}

export function inferDlapiFailureKind(error: unknown): DlapiFailureDiagnostics['failureKind'] {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (isRetriableImageProviderError(error)) return 'gateway'
  if (isDlapiAuthError(error)) return 'auth'
  if (message.includes('returned neither url nor b64_json image data')) return 'empty_payload'
  if (message.includes('returned non-json content')) return 'non_json'
  if (message.includes('returned invalid json')) return 'invalid_json'
  if (isDlapiDirectResponseError(error) || isDlapiAsyncProtocolError(error)) return 'direct_response'
  return 'other'
}

export function extractDlapiFailureStatus(error: unknown): number | undefined {
  const message = error instanceof Error ? error.message : String(error)
  const match =
    /\bDLAPI image API (\d{3})\b/i.exec(message) ??
    /\bOpenAI-compatible image API (\d{3})\b/i.exec(message)

  if (!match) return undefined

  const status = Number(match[1])
  return Number.isFinite(status) ? status : undefined
}

export function extractDlapiResponsePreview(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : String(error)
  const previewMatch = /Response preview:\s*(.+)$/i.exec(message)
  if (previewMatch?.[1]) {
    return summarizeResponseBody(previewMatch[1])
  }

  const statusBodyMatch = /\bDLAPI image API \d{3}:\s*(.+)$/i.exec(message)
  if (statusBodyMatch?.[1]) {
    return summarizeResponseBody(statusBodyMatch[1])
  }

  const gatewayBodyMatch =
    /\bOpenAI-compatible image API \d{3} from .*?:\s*(.+?)\.\s+This usually means/i.exec(message)
  if (gatewayBodyMatch?.[1]) {
    return summarizeResponseBody(gatewayBodyMatch[1])
  }

  return undefined
}

export function measurePromptSize(prompt: string): { chars: number; bytes: number } {
  return {
    chars: prompt.length,
    bytes: new TextEncoder().encode(prompt).length,
  }
}

export function buildPromptTooLongMessage(baseUrl: string, chars: number, bytes: number): string {
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

export function resolveOpenAICompatibleRequestSize(
  _provider: string,
  sizePreset: string,
  aspectRatio: string,
): string {
  if (sizePreset === 'auto') {
    return 'auto'
  }

  return resolveImageGenerationSize(sizePreset, aspectRatio)
}

export function shouldUseOpenRouterChatImageApi(provider: string, model: string): boolean {
  return provider === 'openrouter' && /^openai\/gpt-.*image/i.test(model)
}

export async function parseJsonResponse<T>(
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

export function statusIsGatewayLikeFailure(status: number): boolean {
  return [502, 503, 504, 520, 522, 524].includes(status)
}

export function resolveOpenAICompatibleBaseUrl(
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

export function inferImageContentType(url: string): string {
  if (url.startsWith('data:image/')) {
    const match = /^data:([^;,]+)/i.exec(url)
    return match?.[1] ?? 'image/png'
  }

  if (/\.jpe?g($|\?)/i.test(url)) return 'image/jpeg'
  if (/\.webp($|\?)/i.test(url)) return 'image/webp'
  if (/\.gif($|\?)/i.test(url)) return 'image/gif'
  return 'image/png'
}

export { resolveImageGenerationSize, validateImageSelection }
