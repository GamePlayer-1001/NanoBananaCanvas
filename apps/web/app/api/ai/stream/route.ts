/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/credits, @/lib/db,
 *          @/services/ai (Provider 注册表), @/lib/validations/ai
 * [OUTPUT]: 对外提供 POST /api/ai/stream (双模式 SSE 流式 AI 执行)
 * [POS]: api/ai 的流式端点，冻结在流开始前，确认扣费在流结束后
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { handleApiError } from '@/lib/api/response'
import {
  checkModelAccess,
  confirmSpend,
  decryptApiKey,
  freezeCredits,
  getModelPricing,
  refundCredits,
} from '@/lib/credits'
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import { getPlatformKey, getProvider } from '@/services/ai'
import { aiExecuteSchema } from '@/lib/validations/ai'

const log = createLogger('ai:stream')

/* ─── POST /api/ai/stream ────────────────────────────── */

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()

    // 限流: 30 req/min per user
    const rl = checkRateLimit(`ai:${userId}`, 30, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    const db = await getDb()
    const body = await req.json()
    const params = aiExecuteSchema.parse(body)

    const startTime = Date.now()

    // 获取用户套餐
    const sub = await db
      .prepare('SELECT plan FROM subscriptions WHERE user_id = ?')
      .bind(userId)
      .first<{ plan: string }>()
    const userPlan = sub?.plan ?? 'free'

    // 确定使用的 API Key 和积分
    let apiKey: string
    let freezeTxId: string | null = null
    let creditsToCharge = 0

    if (params.executionMode === 'user_key') {
      // 用户 Key 模式
      const keyRow = await db
        .prepare(
          'SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
        )
        .bind(userId, params.provider)
        .first<{ encrypted_key: string }>()

      if (!keyRow) {
        return handleApiError(new Error(`No API key for provider: ${params.provider}`))
      }

      const encryptionKey = await requireEnv('ENCRYPTION_KEY')
      apiKey = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
    } else {
      // 积分模式
      const pricing = await getModelPricing(db, params.provider, params.modelId)
      checkModelAccess(userPlan, pricing.minPlan)
      creditsToCharge = pricing.creditsPerCall

      freezeTxId = await freezeCredits(db, userId, creditsToCharge)

      apiKey = await getPlatformKey(params.provider)
    }

    // 通过 Provider 抽象层发起流式调用，转为 SSE
    const provider = getProvider(params.provider)
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // 后台 chatStream → SSE 转发
    ;(async () => {
      try {
        await provider.chatStream({
          model: params.modelId,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          maxTokens: params.maxTokens ?? 1024,
          apiKey,
          onChunk: async (chunk) => {
            // 将 Provider 的 chunk 编码为 SSE 格式
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`
            await writer.write(encoder.encode(sseData))
          },
        })

        // 发送 SSE 结束标记
        await writer.write(encoder.encode('data: [DONE]\n\n'))

        // 流结束 → 确认扣费
        if (freezeTxId) {
          try {
            await confirmSpend(db, userId, freezeTxId, creditsToCharge)
          } catch (spendErr) {
            log.error('confirmSpend failed after stream, refunding', {
              userId,
              freezeTxId,
              error: spendErr instanceof Error ? spendErr.message : String(spendErr),
            })
            await refundCredits(db, userId, freezeTxId)
          }
        }

        await writeUsageLog(db, userId, params, 'success', creditsToCharge, Date.now() - startTime)
      } catch (err) {
        // 流传输错误 → 退还积分
        if (freezeTxId) {
          try {
            await refundCredits(db, userId, freezeTxId)
          } catch (refundErr) {
            log.error('Refund failed after stream error', {
              userId,
              freezeTxId,
              error: refundErr instanceof Error ? refundErr.message : String(refundErr),
            })
          }
        }

        await writeUsageLog(
          db,
          userId,
          params,
          'failed',
          0,
          Date.now() - startTime,
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        await writer.close().catch(() => {})
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── Usage Log ──────────────────────────────────────── */

async function writeUsageLog(
  db: D1Database,
  userId: string,
  params: {
    provider: string
    modelId: string
    executionMode: string
    workflowId?: string
    nodeId?: string
  },
  status: string,
  creditsCharged: number,
  durationMs: number,
  errorMessage?: string,
) {
  try {
    await db
      .prepare(
        `INSERT INTO ai_usage_logs (id, user_id, workflow_id, node_id, provider, model_id,
         execution_mode, credits_charged, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nanoid(),
        userId,
        params.workflowId ?? null,
        params.nodeId ?? null,
        params.provider,
        params.modelId,
        params.executionMode,
        creditsCharged,
        durationMs,
        status,
        errorMessage ?? null,
      )
      .run()
  } catch (err) {
    log.warn('Failed to write usage log', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
