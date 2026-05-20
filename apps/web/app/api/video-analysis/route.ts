/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/rate-limit、@/lib/api/response、@/lib/db、@/lib/env、
 *          @/lib/errors、@/lib/billing/ledger、@/lib/billing/metering、@/lib/billing/subscription、@/lib/nanoid、
 *          @/components/video-analysis/video-analysis-prompts
 * [OUTPUT]: 对外提供 GET/POST /api/video-analysis（历史读取 + Pro 权限闸门 + Comfly → Gemini 视频分析）
 * [POS]: api/video-analysis 的服务端分析端点，承接历史持久化、权限控制、视频上传、分析调用与平台积分结算
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
import { getBillingSubscription } from '@/lib/billing/subscription'
import { nanoid } from '@/lib/nanoid'
import {
  buildVideoAnalysisSystemPrompt,
  buildVideoAnalysisUserPrompt,
  type VideoAnalysisResult,
  normalizeVideoAnalysisResult,
} from '@/components/video-analysis/video-analysis-prompts'

const COMFLY_BASE_URL = 'https://ai.comfly.chat/v1'

const VIDEO_ANALYSIS_PRICING_FALLBACK: Record<string, number> = {
  'gemini-2.5-flash': 30,
  'gemini-3.1-pro-preview': 120,
}

type VideoAnalysisHistoryRow = {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  duration_seconds: number
  model_id: string
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
  result_json: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type TableExistsRow = {
  name?: string
}

function ensureSupportedModel(model: string) {
  if (!(model in VIDEO_ANALYSIS_PRICING_FALLBACK)) {
    throw new AIServiceError(ErrorCode.AI_MODEL_UNAVAILABLE, `Unsupported video analysis model: ${model}`)
  }
}

function parseStoredResult(resultJson: string | null): VideoAnalysisResult | null {
  if (!resultJson) return null

  try {
    return normalizeVideoAnalysisResult(JSON.parse(resultJson))
  } catch {
    return null
  }
}

function serializeHistoryRow(row: VideoAnalysisHistoryRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    durationSeconds: row.duration_seconds,
    model: row.model_id,
    status: row.status,
    errorMessage: row.error_message,
    result: parseStoredResult(row.result_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }
}

async function hasVideoAnalysisHistoryTable(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'video_analysis_history'")
    .first<TableExistsRow>()

  return Boolean(row?.name)
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength))
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

async function generateAnalysisResult(input: {
  apiKey: string
  videoBase64: string
  mimeType: string
  model: string
  fileName: string
  durationSeconds: number
}): Promise<VideoAnalysisResult> {
  const response = await fetch(`${COMFLY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: 'system',
          content: buildVideoAnalysisSystemPrompt({ targetDurationSeconds: input.durationSeconds }),
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${input.mimeType};base64,${input.videoBase64}`,
              },
            },
            {
              type: 'text',
              text: buildVideoAnalysisUserPrompt(input.fileName, { targetDurationSeconds: input.durationSeconds }),
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new AIServiceError(
      ErrorCode.AI_PROVIDER_ERROR,
      `Video analysis request failed (${response.status})`,
      { body: body.slice(0, 300) },
    )
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }

  const rawText = payload.choices?.[0]?.message?.content
  if (!rawText) {
    throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Analysis returned an empty result')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, 'Analysis returned invalid JSON')
  }

  return normalizeVideoAnalysisResult(parsed)
}

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    if (!(await hasVideoAnalysisHistoryTable(db))) {
      return apiOk({ items: [] })
    }

    const { results } = await db
      .prepare(
        `SELECT id, file_name, file_size, mime_type, duration_seconds, model_id, status,
                error_message, result_json, created_at, updated_at, completed_at
         FROM video_analysis_history
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
      )
      .bind(userId)
      .all<VideoAnalysisHistoryRow>()

    return apiOk({
      items: results.map(serializeHistoryRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()
    const subscription = await getBillingSubscription(userId)
    if (subscription.plan !== 'pro' && subscription.plan !== 'ultimate') {
      return apiError('PLAN_REQUIRED', 'Video analysis is available for Pro and above plans only', 403)
    }

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
    const hasHistoryTable = await hasVideoAnalysisHistoryTable(db)
    const pricing =
      (await getModelPricing(db, { provider: 'comfly', modelId: model, activeOnly: false })) ??
      {
        id: `fallback_${model}`,
        provider: 'comfly',
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
    const historyId = nanoid()

    try {
      if (hasHistoryTable) {
        await db
          .prepare(
            `INSERT INTO video_analysis_history
              (id, user_id, file_name, file_size, mime_type, duration_seconds, model_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`,
          )
          .bind(
            historyId,
            userId,
            file.name,
            file.size,
            file.type || 'video/mp4',
            durationSeconds,
            model,
          )
          .run()
      }

      if (reservedCredits > 0) {
        await freezeCredits({
          userId,
          requestedCredits: reservedCredits,
          referenceId,
          source: 'video_analysis_platform_freeze',
          description: `Freeze credits for video analysis ${model}`,
        })
      }

      const apiKey = await requireEnv('COMFLY_API_KEY')
      const videoBase64 = await fileToBase64(file)

      const result = await generateAnalysisResult({
        apiKey,
        videoBase64,
        mimeType: file.type || 'video/mp4',
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

      if (hasHistoryTable) {
        await db
          .prepare(
            `UPDATE video_analysis_history
             SET status = 'completed',
                 error_message = NULL,
                 result_json = ?,
                 updated_at = datetime('now'),
                 completed_at = datetime('now')
             WHERE id = ? AND user_id = ?`,
          )
          .bind(JSON.stringify(result), historyId, userId)
          .run()
      }

      const historyRow = hasHistoryTable
        ? await db
            .prepare(
              `SELECT id, file_name, file_size, mime_type, duration_seconds, model_id, status,
                      error_message, result_json, created_at, updated_at, completed_at
               FROM video_analysis_history
               WHERE id = ? AND user_id = ?`,
            )
            .bind(historyId, userId)
            .first<VideoAnalysisHistoryRow>()
        : null

      return apiOk({
        result,
        historyItem: historyRow ? serializeHistoryRow(historyRow) : null,
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

      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Video analysis failed'

      if (hasHistoryTable) {
        await db
          .prepare(
            `UPDATE video_analysis_history
             SET status = 'failed',
                 error_message = ?,
                 updated_at = datetime('now'),
                 completed_at = datetime('now')
             WHERE id = ? AND user_id = ?`,
          )
          .bind(message, historyId, userId)
          .run()
          .catch(() => undefined)
      }

      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
