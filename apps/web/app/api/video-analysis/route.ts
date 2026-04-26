/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/rate-limit、@/lib/api/response、@/lib/db、@/lib/env、
 *          @/lib/errors、@/lib/billing/ledger、@/lib/billing/metering、@/lib/nanoid、
 *          @/components/video-analysis/video-analysis-prompts
 * [OUTPUT]: 对外提供 POST /api/video-analysis（平台内置 Gemini 视频分析 -> 分镜表/剧本 JSON）
 * [POS]: api/video-analysis 的服务端分析端点，承接视频上传、Gemini Files API 调用与平台积分结算
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { AIServiceError, ErrorCode } from '@/lib/errors'
import { confirmFrozenCredits, freezeCredits, refundFrozenCredits } from '@/lib/billing/ledger'
import { estimateBillableUnits, estimateCreditsFromUsage, getModelPricing } from '@/lib/billing/metering'
import { nanoid } from '@/lib/nanoid'
import {
  buildVideoAnalysisSystemPrompt,
  buildVideoAnalysisUserPrompt,
  normalizeVideoAnalysisResult,
} from '@/components/video-analysis/video-analysis-prompts'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files'
const ACTIVE_STATE = 'ACTIVE'
const FAILED_STATE = 'FAILED'
const PROCESSING_POLL_INTERVAL_MS = 2000
const PROCESSING_MAX_POLLS = 30

const VIDEO_ANALYSIS_PRICING_FALLBACK: Record<string, number> = {
  'gemini-2.5-flash-image': 30,
  'gemini-3-pro-preview': 120,
}

type GeminiFileUploadResponse = {
  file?: {
    name?: string
    uri?: string
    mimeType?: string
    state?: string
  }
}

function ensureSupportedModel(model: string) {
  if (!(model in VIDEO_ANALYSIS_PRICING_FALLBACK)) {
    throw new AIServiceError(ErrorCode.AI_MODEL_UNAVAILABLE, `Unsupported video analysis model: ${model}`)
  }
}

async function startGeminiResumableUpload(apiKey: string, file: File) {
  const response = await fetch(`${GEMINI_UPLOAD_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(file.size),
      'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
    },
    body: JSON.stringify({
      file: {
        display_name: file.name,
      },
    }),
  })

  if (!response.ok) {
    throw new AIServiceError(
      ErrorCode.AI_PROVIDER_ERROR,
      `Failed to start Gemini upload (${response.status})`,
    )
  }

  const uploadUrl = response.headers.get('x-goog-upload-url')
  if (!uploadUrl) {
    throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Gemini upload URL is missing')
  }

  return uploadUrl
}

async function uploadGeminiFile(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(file.size),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: file.stream(),
    duplex: 'half',
  } as RequestInit)

  if (!response.ok) {
    throw new AIServiceError(
      ErrorCode.AI_PROVIDER_ERROR,
      `Failed to upload Gemini file (${response.status})`,
    )
  }

  const payload = (await response.json()) as GeminiFileUploadResponse
  if (!payload.file?.name || !payload.file?.uri) {
    throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Gemini file response is incomplete')
  }

  return {
    name: payload.file.name,
    uri: payload.file.uri,
    mimeType: payload.file.mimeType || file.type || 'video/mp4',
    state: payload.file.state || '',
  }
}

async function waitForGeminiFileActive(apiKey: string, fileName: string) {
  for (let attempt = 0; attempt < PROCESSING_MAX_POLLS; attempt += 1) {
    const response = await fetch(`${GEMINI_BASE_URL}/${fileName}?key=${apiKey}`)
    if (!response.ok) {
      throw new AIServiceError(
        ErrorCode.AI_PROVIDER_ERROR,
        `Failed to poll Gemini file state (${response.status})`,
      )
    }

    const payload = (await response.json()) as GeminiFileUploadResponse
    const state = payload.file?.state || ''
    const uri = payload.file?.uri || ''
    const mimeType = payload.file?.mimeType || 'video/mp4'

    if (state === ACTIVE_STATE) {
      return { uri, mimeType }
    }

    if (state === FAILED_STATE) {
      throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Gemini file processing failed')
    }

    await new Promise((resolve) => setTimeout(resolve, PROCESSING_POLL_INTERVAL_MS))
  }

  throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Gemini file processing timed out')
}

async function deleteGeminiFile(apiKey: string, fileName: string) {
  try {
    await fetch(`${GEMINI_BASE_URL}/${fileName}?key=${apiKey}`, {
      method: 'DELETE',
    })
  } catch {
    // 清理失败不阻塞主链路
  }
}

async function generateAnalysisResult(input: {
  apiKey: string
  fileUri: string
  mimeType: string
  model: string
  fileName: string
  durationSeconds: number
}) {
  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${input.model}:generateContent?key=${input.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildVideoAnalysisSystemPrompt({ targetDurationSeconds: input.durationSeconds }) }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              { file_data: { mime_type: input.mimeType, file_uri: input.fileUri } },
              { text: buildVideoAnalysisUserPrompt(input.fileName, { targetDurationSeconds: input.durationSeconds }) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new AIServiceError(
      ErrorCode.AI_PROVIDER_ERROR,
      `Gemini analysis request failed (${response.status})`,
      { body: body.slice(0, 300) },
    )
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Gemini returned an empty analysis result')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Gemini returned invalid JSON for analysis')
  }

  return normalizeVideoAnalysisResult(parsed)
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()
    const rl = await checkRateLimit(`video-analysis:${userId}`, 10, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    const formData = await req.formData()
    const model = String(formData.get('model') ?? '')
    const file = formData.get('file')
    const durationSeconds = Number(formData.get('durationSeconds') ?? 0)

    ensureSupportedModel(model)

    if (!(file instanceof File)) {
      return apiError('VALIDATION_FAILED', 'Video file is required', 400)
    }

    if (!file.type.startsWith('video/')) {
      return apiError('VALIDATION_FAILED', 'Only video files are supported', 400)
    }

    const db = await getDb()
    const pricing =
      (await getModelPricing(db, { provider: 'gemini', modelId: model, activeOnly: false })) ??
      {
        id: `fallback_${model}`,
        provider: 'gemini',
        modelId: model,
        modelName: model,
        category: 'video' as const,
        creditsPer1kUnits: VIDEO_ANALYSIS_PRICING_FALLBACK[model],
        tier: 'premium',
        minPlan: 'standard',
        isActive: true,
      }

    const usageEstimate = estimateBillableUnits({
      category: 'video',
      durationSeconds,
    })
    const reservedCredits = estimateCreditsFromUsage({
      billableUnits: usageEstimate.billableUnits,
      creditsPer1kUnits: pricing.creditsPer1kUnits,
    })
    const referenceId = `video_analysis_${nanoid()}`

    let geminiFileName = ''

    try {
      if (reservedCredits > 0) {
        await freezeCredits({
          userId,
          requestedCredits: reservedCredits,
          referenceId,
          source: 'video_analysis_platform_freeze',
          description: `Freeze credits for video analysis ${model}`,
        })
      }

      const apiKey = await requireEnv('GEMINI_API_KEY')
      const uploadUrl = await startGeminiResumableUpload(apiKey, file)
      const uploadedFile = await uploadGeminiFile(uploadUrl, file)
      geminiFileName = uploadedFile.name
      const readyFile = await waitForGeminiFileActive(apiKey, uploadedFile.name)

      const result = await generateAnalysisResult({
        apiKey,
        fileUri: readyFile.uri,
        mimeType: readyFile.mimeType,
        model,
        fileName: file.name,
        durationSeconds,
      })

      if (reservedCredits > 0) {
        await confirmFrozenCredits({
          userId,
          referenceId,
          requestedCredits: reservedCredits,
          source: 'video_analysis_platform_confirm',
          description: `Confirm video analysis billing ${model}`,
        })
      }

      if (geminiFileName) {
        void deleteGeminiFile(apiKey, geminiFileName)
      }

      return apiOk({
        result,
        usage: {
          reservedCredits,
          billableUnits: usageEstimate.billableUnits,
        },
      })
    } catch (error) {
      if (reservedCredits > 0) {
        await refundFrozenCredits({
          userId,
          referenceId,
          requestedCredits: reservedCredits,
          source: 'video_analysis_platform_refund',
          description: `Refund failed video analysis ${model}`,
        }).catch(() => undefined)
      }

      if (geminiFileName) {
        const apiKey = await requireEnv('GEMINI_API_KEY').catch(() => '')
        if (apiKey) void deleteGeminiFile(apiKey, geminiFileName)
      }

      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
