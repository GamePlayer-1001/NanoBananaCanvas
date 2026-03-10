/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/credits, @/lib/db,
 *          @/lib/env, @/lib/nanoid, @/services/ai/openrouter, @/lib/validations/ai
 * [OUTPUT]: 对外提供 POST /api/ai/execute (双模式 AI 执行)
 * [POS]: api/ai 的核心执行端点，实现积分模式 (freeze→call→confirm/refund) 和 Key 模式
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiOk, handleApiError } from '@/lib/api/response'
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
import { openRouter } from '@/services/ai/openrouter'
import { aiExecuteSchema } from '@/lib/validations/ai'

const log = createLogger('ai:execute')

/* ─── POST /api/ai/execute ───────────────────────────── */

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

    if (params.executionMode === 'user_key') {
      return await executeWithUserKey(db, userId, userPlan, params, startTime)
    }

    return await executeWithCredits(db, userId, userPlan, params, startTime)
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── Credits Mode ───────────────────────────────────── */

async function executeWithCredits(
  db: D1Database,
  userId: string,
  userPlan: string,
  params: ReturnType<typeof aiExecuteSchema.parse>,
  startTime: number,
) {
  const pricing = await getModelPricing(db, params.provider, params.modelId)
  checkModelAccess(userPlan, pricing.minPlan)

  // 冻结积分
  const freezeTxId = await freezeCredits(db, userId, pricing.creditsPerCall)

  try {
    // 使用平台 Key 调用 AI
    const platformKey = await requireEnv('OPENROUTER_API_KEY')

    const chatResult = await openRouter.chat({
      model: params.modelId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 1024,
      apiKey: platformKey,
    })

    // 确认扣费
    await confirmSpend(db, userId, freezeTxId, pricing.creditsPerCall)

    // 写日志
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: params.modelId,
      executionMode: 'credits',
      creditsCharged: pricing.creditsPerCall,
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      durationMs: Date.now() - startTime,
      status: 'success',
    })

    return apiOk({ result: chatResult.content, creditsCharged: pricing.creditsPerCall })
  } catch (error) {
    // 退还冻结积分
    await refundCredits(db, userId, freezeTxId)

    // 写失败日志
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: params.modelId,
      executionMode: 'credits',
      creditsCharged: 0,
      durationMs: Date.now() - startTime,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/* ─── User Key Mode ──────────────────────────────────── */

async function executeWithUserKey(
  db: D1Database,
  userId: string,
  userPlan: string,
  params: ReturnType<typeof aiExecuteSchema.parse>,
  startTime: number,
) {
  // 读取并解密用户 Key
  const keyRow = await db
    .prepare(
      'SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
    )
    .bind(userId, params.provider)
    .first<{ encrypted_key: string }>()

  if (!keyRow) {
    return handleApiError(
      new Error(`No API key configured for provider: ${params.provider}`),
    )
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')

  const apiKey = await decryptApiKey(keyRow.encrypted_key, encryptionKey)

  try {
    const chatResult = await openRouter.chat({
      model: params.modelId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 1024,
      apiKey,
    })

    // 更新 last_used_at
    await db
      .prepare("UPDATE user_api_keys SET last_used_at = datetime('now') WHERE user_id = ? AND provider = ?")
      .bind(userId, params.provider)
      .run()

    // 写日志 (不扣积分)
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: params.modelId,
      executionMode: 'user_key',
      creditsCharged: 0,
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      durationMs: Date.now() - startTime,
      status: 'success',
    })

    return apiOk({ result: chatResult.content, creditsCharged: 0 })
  } catch (error) {
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: params.modelId,
      executionMode: 'user_key',
      creditsCharged: 0,
      durationMs: Date.now() - startTime,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/* ─── Usage Log ──────────────────────────────────────── */

interface UsageLogParams {
  userId: string
  workflowId?: string
  nodeId?: string
  provider: string
  modelId: string
  executionMode: string
  creditsCharged: number
  inputTokens?: number | null
  outputTokens?: number | null
  durationMs: number
  status: string
  errorMessage?: string
}

async function writeUsageLog(db: D1Database, params: UsageLogParams) {
  try {
    await db
      .prepare(
        `INSERT INTO ai_usage_logs (id, user_id, workflow_id, node_id, provider, model_id,
         execution_mode, credits_charged, input_tokens, output_tokens, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nanoid(),
        params.userId,
        params.workflowId ?? null,
        params.nodeId ?? null,
        params.provider,
        params.modelId,
        params.executionMode,
        params.creditsCharged,
        params.inputTokens ?? null,
        params.outputTokens ?? null,
        params.durationMs,
        params.status,
        params.errorMessage ?? null,
      )
      .run()
  } catch (err) {
    log.warn('Failed to write usage log', { error: err instanceof Error ? err.message : String(err) })
  }
}
