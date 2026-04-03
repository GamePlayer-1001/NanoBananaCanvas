/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/credits, @/lib/db,
 *          @/lib/user-model-config, @/services/ai (Provider 注册表), @/services/ai/openai-compatible,
 *          @/lib/validations/ai
 * [OUTPUT]: 对外提供 POST /api/ai/stream (双模式 SSE 流式 AI 执行)
 * [POS]: api/ai 的流式端点，冻结在流开始前，确认扣费在流结束后，并支持账号级模型槽位
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiError, handleApiError, withBodyLimit } from '@/lib/api/response'
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
import {
  deserializeUserModelConfig,
  isUserModelConfigSlotId,
  toRuntimeUserModelConfig,
  type UserModelRuntimeConfig,
} from '@/lib/user-model-config'
import { getPlatformKey, getProvider } from '@/services/ai'
import { OpenAICompatibleClient } from '@/services/ai/openai-compatible'
import { aiExecuteSchema } from '@/lib/validations/ai'

const log = createLogger('ai:stream')

/* ─── Retry Helper ──────────────────────────────────── */

async function retryCreditOp(op: () => Promise<void>, maxAttempts = 2): Promise<boolean> {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await op()
      return true
    } catch (err) {
      if (i === maxAttempts) {
        log.error('Credit op failed after retries', err, { attempt: i })
      }
    }
  }
  return false
}

/* ─── POST /api/ai/stream ────────────────────────────── */

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()

    // 限流: 30 req/min per user
    const rl = await checkRateLimit(`ai:${userId}`, 30, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    const db = await getDb()
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('VALIDATION_FAILED', 'Invalid JSON body', 400)
    }
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
    let resolvedModelId = params.modelId
    let runtimeConfig: UserModelRuntimeConfig | null = null

    if (params.executionMode === 'user_key') {
      runtimeConfig = await getUserRuntimeConfig(db, userId, params.provider)
      apiKey = runtimeConfig.apiKey
      resolvedModelId = runtimeConfig.modelId
    } else {
      // 积分模式
      const pricing = await getModelPricing(db, params.provider, params.modelId)
      checkModelAccess(userPlan, pricing.minPlan)
      creditsToCharge = pricing.creditsPerCall

      freezeTxId = await freezeCredits(db, userId, creditsToCharge)

      apiKey = await getPlatformKey(params.provider)
    }

    // 通过 Provider 抽象层发起流式调用，转为 SSE
    const provider =
      runtimeConfig
        ? getUserKeyProvider(runtimeConfig)
        : getProvider(params.provider)
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // 后台 chatStream → SSE 转发
    // 使用 ctx.waitUntil() 保障 Worker 在流结束后仍存活
    // 确保积分 confirm/refund 操作一定完成
    const { ctx } = await getCloudflareContext()

    const streamTask = (async () => {
      try {
        await provider.chatStream({
          model: resolvedModelId,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          maxTokens: params.maxTokens ?? 1024,
          apiKey,
          onChunk: async (chunk) => {
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`
            await writer.write(encoder.encode(sseData))
          },
        })

        await writer.write(encoder.encode('data: [DONE]\n\n'))

        // 流结束 → 确认扣费 (带重试，失败后退还，Cron 兜底)
        if (freezeTxId) {
          const confirmed = await retryCreditOp(() =>
            confirmSpend(db, userId, freezeTxId!, creditsToCharge),
          )
          if (!confirmed) {
            log.error('confirmSpend failed, attempting refund', undefined, { userId, freezeTxId })
            const refunded = await retryCreditOp(() => refundCredits(db, userId, freezeTxId!))
            if (!refunded) {
              log.error('CRITICAL: credits frozen, Cron unfreeze will recover', undefined, {
                userId, freezeTxId, amount: creditsToCharge,
              })
            }
          }
        }

        await writeUsageLog(
          db,
          userId,
          { ...params, modelId: resolvedModelId },
          'success',
          creditsToCharge,
          Date.now() - startTime,
        )
      } catch (err) {
        if (freezeTxId) {
          const refunded = await retryCreditOp(() => refundCredits(db, userId, freezeTxId!))
          if (!refunded) {
            log.error('CRITICAL: refund failed, Cron unfreeze will recover', undefined, {
              userId, freezeTxId,
            })
          }
        }

        await writeUsageLog(
          db,
          userId,
          { ...params, modelId: resolvedModelId },
          'failed',
          0,
          Date.now() - startTime,
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        await writer.close().catch(() => {})
      }
    })()

    ctx.waitUntil(streamTask)

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

async function getUserRuntimeConfig(
  db: D1Database,
  userId: string,
  provider: string,
): Promise<UserModelRuntimeConfig> {
  if (!isUserModelConfigSlotId(provider)) {
    throw new Error(`Unsupported user_key provider slot: ${provider}`)
  }

  const keyRow = await db
    .prepare(
      'SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
    )
    .bind(userId, provider)
    .first<{ encrypted_key: string }>()

  if (!keyRow) {
    throw new Error('No API key configured for this provider')
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(provider, decrypted)
  return toRuntimeUserModelConfig(provider, payload)
}

function getUserKeyProvider(config: UserModelRuntimeConfig) {
  if (config.providerKind === 'openai-compatible') {
    if (!config.baseUrl) {
      throw new Error('OpenAI-compatible provider requires a base URL')
    }
    return new OpenAICompatibleClient(config.baseUrl)
  }

  return getProvider(config.providerId)
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
