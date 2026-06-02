/**
 * [INPUT]: 依赖 ./image-gen-helpers 的工具函数与类型，依赖 ./types 的 TaskProcessor 接口
 * [OUTPUT]: 对外提供 ImageGenProcessor 类（OpenAI 兼容 + Google 图片生成 + DLAPI 直出图）
 * [POS]: lib/tasks/processors 的图片生成处理器，负责平台图片主链、托底切流与统一图片能力护栏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { CheckResult, SubmitInput, SubmitResult, TaskProcessor } from './types'
import {
  assertOpenAICompatiblePromptSafety,
  buildDlapiAuthFallbackFailureMessage,
  buildGatewayFailureMessage,
  buildMultipartImageEditRequestInit,
  COMFLY_IMAGE_BASE_URL,
  DLAPI_IMAGE_BASE_URL,
  extractChatCompletionsImageUrl,
  extractDlapiFailureStatus,
  extractDlapiResponsePreview,
  extractOpenAICompatibleImageUrl,
  IMAGE_PROVIDER_FALLBACK_MODEL_MAP,
  inferDlapiFailureKind,
  inferImageContentType,
  isDlapiAsyncProtocolError,
  isDlapiAuthError,
  isDlapiDirectResponseError,
  isRetriableImageProviderError,
  log,
  normalizeImagePromptForApi,
  parseJsonResponse,
  readImageCapabilities,
  readMaskImageUrl,
  readReferenceImageUrl,
  resolveOpenAICompatibleBaseUrl,
  resolveOpenAICompatibleRequestSize,
  shouldUseOpenRouterChatImageApi,
  statusIsGatewayLikeFailure,
  summarizeResponseBody,
  toImageDataUrl,
  validateImageSelection,
} from './image-gen-helpers'
import type {
  ChatCompletionsImageResponse,
  DlapiFailureDiagnostics,
  DlapiImageTaskCheckResponse,
  OpenAICompatibleImageResponse,
} from './image-gen-helpers'

export {
  normalizeImagePromptForApi,
  assertOpenAICompatiblePromptSafety,
} from './image-gen-helpers'
export {
  resolveImageGenerationSize,
  resolveOpenAICompatibleRequestSize,
} from './image-gen-helpers'

async function chatCompletionsImageSubmit(
  input: SubmitInput,
  apiKey: string,
  provider: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const referenceImageUrl = readReferenceImageUrl(params)
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const baseUrl = resolveOpenAICompatibleBaseUrl(provider, params)

  assertOpenAICompatiblePromptSafety(prompt, baseUrl)

  const body: Record<string, unknown> = {
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
  }

  if (provider === 'openrouter') {
    body.modalities = ['image', 'text']
    body.image_config =
      sizePreset === 'auto'
        ? { aspect_ratio: aspectRatio }
        : { aspect_ratio: aspectRatio, image_size: sizePreset }
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(buildGatewayFailureMessage(res.status, provider, baseUrl, text))
    }
    throw new Error(`${provider} chat image API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<ChatCompletionsImageResponse>(
    res,
    `${provider} chat image API`,
  )
  const url = extractChatCompletionsImageUrl(data)

  if (!url) {
    throw new Error(`${provider} chat image API returned no assistant image data`)
  }

  return { url }
}

async function comflyMaskEditSubmit(
  input: SubmitInput,
  apiKey: string,
  referenceImageUrl: string,
  maskImageUrl: string,
): Promise<{ url: string }> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const size = resolveOpenAICompatibleRequestSize('comfly', sizePreset, aspectRatio)
  const baseUrl = COMFLY_IMAGE_BASE_URL
  const endpoint = `${baseUrl}/images/edits`

  assertOpenAICompatiblePromptSafety(prompt, baseUrl)

  const requestInit = await buildMultipartImageEditRequestInit(
    apiKey,
    model,
    prompt,
    size,
    referenceImageUrl,
    input.loadInternalReferenceImageAsset,
    maskImageUrl,
  )

  const res = await fetch(endpoint, requestInit)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(buildGatewayFailureMessage(res.status, 'comfly', endpoint, text))
    }
    throw new Error(`Comfly mask edit API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<OpenAICompatibleImageResponse>(
    res,
    'Comfly mask edit API',
  )

  const url = extractOpenAICompatibleImageUrl(data)
  if (!url) {
    throw new Error('Comfly mask edit API returned neither url nor b64_json image data')
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
  const maskImageUrl = readMaskImageUrl(params)
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

  if (provider === 'comfly' && referenceImageUrl && maskImageUrl) {
    return comflyMaskEditSubmit(input, apiKey, referenceImageUrl, maskImageUrl)
  }

  if (provider === 'openrouter' && referenceImageUrl) {
    return chatCompletionsImageSubmit(input, apiKey, 'openrouter')
  }

  if (provider === 'comfly' && referenceImageUrl) {
    return chatCompletionsImageSubmit(input, apiKey, 'comfly')
  }

  if (shouldUseOpenRouterChatImageApi(provider, model)) {
    return chatCompletionsImageSubmit(input, apiKey, 'openrouter')
  }

  const requestPath = referenceImageUrl ? '/images/edits' : '/images/generations'
  const requestInit = referenceImageUrl
    ? {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          size,
          images: [{ image_url: referenceImageUrl }],
          n: 1,
        }),
      }
    : {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, prompt, size, aspect_ratio: aspectRatio, n: 1 }),
      }

  const res = await fetch(`${baseUrl}${requestPath}`, requestInit)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(
        buildGatewayFailureMessage(
          res.status,
          provider,
          `${baseUrl}${requestPath}`,
          text,
        ),
      )
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

async function dlapiSubmit(input: SubmitInput, apiKey: string): Promise<SubmitResult> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const referenceImageUrl = readReferenceImageUrl(params)
  const maskImageUrl = readMaskImageUrl(params)
  const capabilities = readImageCapabilities(params)
  const violation = validateImageSelection(sizePreset, aspectRatio, capabilities)

  if (violation) {
    throw new Error(violation.message)
  }

  const size = resolveOpenAICompatibleRequestSize('dlapi', sizePreset, aspectRatio)
  const endpoint = referenceImageUrl
    ? `${DLAPI_IMAGE_BASE_URL}/images/edits`
    : `${DLAPI_IMAGE_BASE_URL}/images/generations`
  const startedAt = Date.now()

  const requestInit: RequestInit = referenceImageUrl
    ? await (async () => {
        return buildMultipartImageEditRequestInit(
          apiKey,
          model,
          prompt,
          size,
          referenceImageUrl,
          input.loadInternalReferenceImageAsset,
          maskImageUrl,
        )
      })()
    : {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          size,
          aspect_ratio: aspectRatio,
          n: 1,
        }),
      }

  const res = await fetch(endpoint, {
    ...requestInit,
    signal: AbortSignal.timeout(60_000),
  })
  const elapsedMs = Date.now() - startedAt

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    log.warn('DLAPI image submit failed', {
      model,
      endpoint,
      sizePreset,
      resolvedSize: size,
      aspectRatio,
      hasReferenceImage: Boolean(referenceImageUrl),
      elapsedMs,
      status: res.status,
      responsePreview: summarizeResponseBody(text),
    })
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(buildGatewayFailureMessage(res.status, 'dlapi', endpoint, text))
    }
    throw new Error(`DLAPI image API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<OpenAICompatibleImageResponse>(
    res,
    'DLAPI image API',
  )

  const url = extractOpenAICompatibleImageUrl(data)
  if (!url) {
    log.warn('DLAPI image submit returned no usable image payload', {
      model,
      endpoint,
      sizePreset,
      resolvedSize: size,
      aspectRatio,
      hasReferenceImage: Boolean(referenceImageUrl),
      elapsedMs,
    })
    throw new Error('DLAPI image API returned neither url nor b64_json image data')
  }

  log.info('DLAPI image submit succeeded', {
    model,
    endpoint,
    sizePreset,
    resolvedSize: size,
    aspectRatio,
    hasReferenceImage: Boolean(referenceImageUrl),
    elapsedMs,
    outputKind: url.startsWith('data:') ? 'base64' : 'url',
  })

  return {
    externalTaskId: null,
    initialStatus: 'completed',
    result: {
      type: 'url',
      url,
      contentType: inferImageContentType(url),
    },
  }
}

/* ─── Comfly 异步生图 ────────────────────────────── */

/** Comfly 异步提交响应: POST /v1/images/generations?async=true → { task_id } */
export interface ComflyAsyncSubmitResponse {
  task_id?: string
}

/** Comfly 任务状态查询响应: GET /v1/images/tasks/{task_id} (真实返回结构，非文档) */
export interface ComflyAsyncTaskResponse {
  code?: string
  message?: string
  data?: {
    task_id?: string
    status?: 'NOT_START' | 'RUNNING' | 'SUCCESS' | 'FAIL'
    progress?: string
    fail_reason?: string
    data?:
      | {
          url?: string
          b64_json?: string
        }
      | Array<{
          url?: string
          b64_json?: string
        }>
      | null
    url?: string
    b64_json?: string
    result?:
      | {
          url?: string
          b64_json?: string
        }
      | Array<{
          url?: string
          b64_json?: string
        }>
      | null
    output?:
      | {
          url?: string
          b64_json?: string
        }
      | Array<{
          url?: string
          b64_json?: string
        }>
      | null
    images?: Array<{
      url?: string
      b64_json?: string
    }> | null
  }
}

async function comflyAsyncSubmit(
  input: SubmitInput,
  apiKey: string,
): Promise<SubmitResult> {
  const { model, params } = input
  const prompt = normalizeImagePromptForApi((params.prompt as string) ?? '')
  const sizePreset = (params.size as string) ?? '1k'
  const aspectRatio = (params.aspectRatio as string) ?? '1:1'
  const referenceImageUrl = readReferenceImageUrl(params)
  const baseUrl = COMFLY_IMAGE_BASE_URL

  if (referenceImageUrl) {
    /* 有参考图时走 chat-completions 路径（仍走同步） */
    const result = await chatCompletionsImageSubmit(input, apiKey, 'comfly')
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

  const size = resolveOpenAICompatibleRequestSize('comfly', sizePreset, aspectRatio)
  assertOpenAICompatiblePromptSafety(prompt, baseUrl)

  const res = await fetch(`${baseUrl}/images/generations?async=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      aspect_ratio: aspectRatio,
      n: 1,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (statusIsGatewayLikeFailure(res.status)) {
      throw new Error(
        buildGatewayFailureMessage(
          res.status,
          'comfly',
          `${baseUrl}/images/generations?async=true`,
          text,
        ),
      )
    }
    throw new Error(`Comfly async submit API ${res.status}: ${text}`)
  }

  const data = await parseJsonResponse<ComflyAsyncSubmitResponse>(
    res,
    'Comfly async submit API',
  )
  const taskId = data.task_id

  if (!taskId) {
    throw new Error('Comfly async submit returned no task_id')
  }

  log.info('Comfly async task submitted', {
    model,
    taskId,
    sizePreset,
    aspectRatio,
    hasReferenceImage: false,
  })

  return {
    externalTaskId: taskId,
    initialStatus: 'running',
  }
}

function extractComflyAsyncImageUrl(
  payload: ComflyAsyncTaskResponse['data'] | undefined,
): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const directUrl = payload.url
  if (typeof directUrl === 'string' && directUrl.trim()) {
    return directUrl.trim()
  }

  const directBase64 = payload.b64_json
  if (typeof directBase64 === 'string' && directBase64.trim()) {
    return toImageDataUrl(directBase64.trim())
  }

  const candidateContainers: unknown[] = [
    payload.data,
    payload.result,
    payload.output,
    payload.images,
  ]

  for (const candidate of candidateContainers) {
    if (!candidate) continue

    if (Array.isArray(candidate)) {
      const url = extractOpenAICompatibleImageUrl({
        data: candidate
          .filter(
            (item): item is Record<string, unknown> => !!item && typeof item === 'object',
          )
          .map((item) => ({
            url: typeof item.url === 'string' ? item.url : undefined,
            b64_json: typeof item.b64_json === 'string' ? item.b64_json : undefined,
          })),
      })
      if (url) return url
      continue
    }

    if (typeof candidate === 'object') {
      const typed = candidate as {
        url?: unknown
        b64_json?: unknown
        image_url?: { url?: unknown }
      }

      if (typeof typed.url === 'string' && typed.url.trim()) {
        return typed.url.trim()
      }

      if (typeof typed.b64_json === 'string' && typed.b64_json.trim()) {
        return toImageDataUrl(typed.b64_json.trim())
      }

      if (typeof typed.image_url?.url === 'string' && typed.image_url.url.trim()) {
        return typed.image_url.url.trim()
      }
    }
  }

  return null
}

async function comflyAsyncCheckStatus(
  externalTaskId: string,
  apiKey: string,
): Promise<CheckResult> {
  const res = await fetch(`${COMFLY_IMAGE_BASE_URL}/images/tasks/${externalTaskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Comfly async status API ${res.status}: ${text}`)
  }

  const wrapped = await parseJsonResponse<ComflyAsyncTaskResponse>(
    res,
    'Comfly async status API',
  )

  /* Comfly 返回双层包装: { code:'success', data: { status, progress, data } } */
  const d =
    wrapped.code === 'success'
      ? wrapped.data
      : (wrapped as unknown as ComflyAsyncTaskResponse['data'])
  const status = d?.status
  const progressStr = d?.progress ?? '0%'
  const progressNum = Math.max(
    0,
    Math.min(100, Number.parseInt(progressStr.replace('%', ''), 10) || 0),
  )

  if (status === 'FAIL') {
    return {
      status: 'failed',
      progress: 0,
      error: d?.fail_reason ?? 'Comfly image generation failed',
    }
  }

  if (status === 'SUCCESS') {
    const finalUrl = extractComflyAsyncImageUrl(d)

    if (!finalUrl) {
      log.warn('Comfly async task completed without usable image payload', {
        externalTaskId,
        status,
        responsePreview: summarizeResponseBody(JSON.stringify(wrapped)),
      })
      return {
        status: 'failed',
        progress: 100,
        error: 'Comfly image generation completed without image payload',
      }
    }

    log.info('Comfly async task completed', {
      externalTaskId,
      outputKind: finalUrl.startsWith('data:') ? 'base64' : 'url',
    })

    return {
      status: 'completed',
      progress: 100,
      result: {
        type: 'url',
        url: finalUrl,
        contentType: inferImageContentType(finalUrl),
      },
    }
  }

  /* NOT_START / RUNNING / undefined — 都视为进行中 */
  return {
    status: 'running',
    progress: status === 'NOT_START' ? 0 : Math.max(5, progressNum),
  }
}

async function dlapiCheckStatus(
  externalTaskId: string,
  apiKey: string,
): Promise<CheckResult> {
  const res = await fetch(
    `${DLAPI_IMAGE_BASE_URL}/images/generations/${externalTaskId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  )

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
  const sizePreset = (input.params.size as string) ?? '1k'
  const aspectRatio = (input.params.aspectRatio as string) ?? '1:1'
  const referenceImageUrl = readReferenceImageUrl(input.params)
  const resolvedSize = resolveOpenAICompatibleRequestSize(
    'dlapi',
    sizePreset,
    aspectRatio,
  )
  const endpoint = referenceImageUrl
    ? `${DLAPI_IMAGE_BASE_URL}/images/edits`
    : `${DLAPI_IMAGE_BASE_URL}/images/generations`
  const startedAt = Date.now()

  try {
    return await dlapiSubmit(input, apiKey)
  } catch (error) {
    if (
      !isRetriableImageProviderError(error) &&
      !isDlapiAuthError(error) &&
      !isDlapiAsyncProtocolError(error) &&
      !isDlapiDirectResponseError(error)
    ) {
      throw error
    }

    if (isDlapiAuthError(error) && !input.fallbackApiKey) {
      throw new Error(buildDlapiAuthFallbackFailureMessage(error))
    }

    log.warn('DLAPI image submit failed, fallback to Comfly', {
      error: error instanceof Error ? error.message : String(error),
      model: input.model,
      hasDedicatedFallbackKey: Boolean(input.fallbackApiKey),
      sizePreset: typeof input.params.size === 'string' ? input.params.size : null,
      aspectRatio:
        typeof input.params.aspectRatio === 'string' ? input.params.aspectRatio : null,
    })

    const fallbackModel =
      IMAGE_PROVIDER_FALLBACK_MODEL_MAP.dlapi[input.model] ?? input.model
    const fallbackApiKey = input.fallbackApiKey ?? apiKey
    const diagnostics: DlapiFailureDiagnostics = {
      stage: 'submit',
      requestedProvider: 'dlapi',
      requestedModel: input.model,
      fallbackProvider: 'comfly',
      fallbackModel,
      endpoint,
      status: extractDlapiFailureStatus(error),
      responsePreview: extractDlapiResponsePreview(error),
      errorMessage: error instanceof Error ? error.message : String(error),
      failureKind: inferDlapiFailureKind(error),
      sizePreset,
      resolvedSize,
      aspectRatio,
      hasReferenceImage: Boolean(referenceImageUrl),
      elapsedMs: Date.now() - startedAt,
    }
    const result = await openAICompatibleSubmit(
      {
        ...input,
        model: fallbackModel,
      },
      fallbackApiKey,
      'comfly',
    )
    return {
      externalTaskId: null,
      initialStatus: 'completed',
      result: {
        type: 'url',
        url: result.url,
        contentType: inferImageContentType(result.url),
      },
      providerOverride: 'comfly',
      modelOverride: fallbackModel,
      diagnostics,
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
        return comflyAsyncSubmit(input, apiKey)
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

    if (this.provider === 'comfly') {
      return comflyAsyncCheckStatus(externalTaskId, _apiKey)
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
