/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/credits, @/lib/db, @/lib/env, @/lib/nanoid, @/services/ai/openrouter, @/lib/validations/ai
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
import { getEnv, requireEnv } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import { aiExecuteSchema } from '@/lib/validations/ai'

const log = createLogger('ai:stream')

const AI_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

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

      apiKey = await requireEnv('OPENROUTER_API_KEY')
    }

    // 发起流式请求
    const upstreamRes = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': (await getEnv('NEXT_PUBLIC_APP_URL')) ?? '',
        'X-Title': 'Nano Banana Canvas',
      },
      body: JSON.stringify({
        model: params.modelId,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1024,
        stream: true,
      }),
    })

    if (!upstreamRes.ok || !upstreamRes.body) {
      // 请求失败，退还积分
      if (freezeTxId) await refundCredits(db, userId, freezeTxId)

      await writeUsageLog(db, userId, params, 'failed', 0, Date.now() - startTime,
        `Upstream error: ${upstreamRes.status}`)

      return new Response(
        JSON.stringify({ ok: false, error: { code: 'AI_PROVIDER_ERROR', message: `AI error: ${upstreamRes.status}` } }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 代理 SSE 流
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const reader = upstreamRes.body.getReader()

    // 后台处理流
    // NOTE: SSE 流必须先返回 Response，扣费在流结束后异步完成
    // 安全保证: freeze 在返回前同步完成，失败必退还
    ;(async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }

        // 流结束 → 确认扣费
        if (freezeTxId) {
          try {
            await confirmSpend(db, userId, freezeTxId, creditsToCharge)
          } catch (spendErr) {
            // 扣费失败 → 退还冻结积分，保证用户不亏
            log.error('confirmSpend failed after stream, refunding', {
              userId, freezeTxId, error: spendErr instanceof Error ? spendErr.message : String(spendErr),
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
              userId, freezeTxId, error: refundErr instanceof Error ? refundErr.message : String(refundErr),
            })
          }
        }

        await writeUsageLog(db, userId, params, 'failed', 0, Date.now() - startTime,
          err instanceof Error ? err.message : String(err))
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
  params: { provider: string; modelId: string; executionMode: string; workflowId?: string; nodeId?: string },
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
        nanoid(), userId, params.workflowId ?? null, params.nodeId ?? null,
        params.provider, params.modelId, params.executionMode,
        creditsCharged, durationMs, status, errorMessage ?? null,
      )
      .run()
  } catch (err) {
    log.warn('Failed to write usage log', { error: err instanceof Error ? err.message : String(err) })
  }
}
