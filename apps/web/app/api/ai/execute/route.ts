/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db,
 *          @/lib/env, @/lib/nanoid, @/lib/user-model-config, @/services/ai, @/services/ai/openai-compatible,
 *          @/lib/validations/ai, @/lib/api-key-crypto
 * [OUTPUT]: 对外提供 POST /api/ai/execute (平台 Key / user_key 双模式 AI 执行)
 * [POS]: api/ai 的核心执行端点，统一免费平台执行与账号级模型槽位执行的入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { decryptApiKey } from '@/lib/api-key-crypto'
import {
  confirmFrozenCredits,
  freezeCredits,
  refundFrozenCredits,
} from '@/lib/billing/ledger'
import {
  estimateBillableUnits,
  estimateCreditsFromUsage,
  estimateReservedTextExecutionUsage,
  getModelPricing,
} from '@/lib/billing/metering'
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import {
  deserializeUserModelConfig,
  toRuntimeUserModelConfig,
  type UserModelRuntimeConfig,
} from '@/lib/user-model-config'
import { getPlatformKey, getProvider } from '@/services/ai'
import { OpenAICompatibleClient } from '@/services/ai/openai-compatible'
import { aiExecuteSchema } from '@/lib/validations/ai'

const log = createLogger('ai:execute')

/* ─── POST /api/ai/execute ───────────────────────────── */

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

    if (params.executionMode === 'user_key') {
      return await executeWithUserKey(db, userId, params, startTime)
    }

    return await executeWithPlatformKey(db, userId, params, startTime)
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── Platform Key Mode ─────────────────────────────── */

async function executeWithPlatformKey(
  db: D1Database,
  userId: string,
  params: ReturnType<typeof aiExecuteSchema.parse>,
  startTime: number,
) {
  const providerId = params.provider as string
  const modelId = params.modelId as string
  const executionReferenceId = `ai_exec_${nanoid()}`
  const pricing = await getModelPricing(db, { provider: providerId, modelId, activeOnly: false })
  const reservedUsage = estimateReservedTextExecutionUsage(params.messages, params.maxTokens)
  const reservedCredits =
    pricing
      ? estimateCreditsFromUsage({
          billableUnits: reservedUsage.billableUnits,
          creditsPer1kUnits: pricing.creditsPer1kUnits,
        })
      : 0

  try {
    if (reservedCredits > 0) {
      await freezeCredits({
        userId,
        requestedCredits: reservedCredits,
        referenceId: executionReferenceId,
        source: 'ai_execute_platform_freeze',
        description: `Freeze credits for platform execution ${providerId}/${modelId}`,
      })
    }

    const platformKey = await getPlatformKey(providerId)
    const provider = getProvider(providerId)

    const chatResult = await provider.chat({
      model: modelId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 1024,
      apiKey: platformKey,
    })

    const usageEstimate = estimateBillableUnits({
      category: pricing?.category ?? 'text',
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      messages: params.messages,
      outputText: chatResult.content,
    })

    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: providerId,
      modelId,
      executionMode: 'platform',
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      billableUnits: usageEstimate.billableUnits,
      estimatedCredits:
        pricing
          ? estimateCreditsFromUsage({
              billableUnits: usageEstimate.billableUnits,
              creditsPer1kUnits: pricing.creditsPer1kUnits,
            })
          : null,
      durationMs: Date.now() - startTime,
      status: 'success',
    })

    if (pricing) {
      const actualCredits = estimateCreditsFromUsage({
        billableUnits: usageEstimate.billableUnits,
        creditsPer1kUnits: pricing.creditsPer1kUnits,
      })

      if (actualCredits > reservedCredits) {
        await freezeCredits({
          userId,
          requestedCredits: actualCredits - reservedCredits,
          referenceId: executionReferenceId,
          source: 'ai_execute_platform_adjust',
          description: `Freeze additional credits for platform execution ${providerId}/${modelId}`,
        })
      }

      await confirmFrozenCredits({
        userId,
        referenceId: executionReferenceId,
        requestedCredits: actualCredits,
        source: 'ai_execute_platform_confirm',
        description: `Confirm platform execution billing ${providerId}/${modelId}`,
      })

      if (actualCredits < reservedCredits) {
        await refundFrozenCredits({
          userId,
          referenceId: executionReferenceId,
          source: 'ai_execute_platform_refund',
          description: `Refund unused reserved credits for platform execution ${providerId}/${modelId}`,
        })
      }
    }

    return apiOk({ result: chatResult.content })
  } catch (error) {
    if (reservedCredits > 0) {
      try {
        await refundFrozenCredits({
          userId,
          referenceId: executionReferenceId,
          source: 'ai_execute_platform_failure_refund',
          description: `Refund failed platform execution ${providerId}/${modelId}`,
        })
      } catch (refundError) {
        log.error('Failed to refund frozen credits after execute error', refundError as Error, {
          userId,
          providerId,
          modelId,
          executionReferenceId,
        })
      }
    }

    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: providerId,
      modelId,
      executionMode: 'platform',
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
  params: ReturnType<typeof aiExecuteSchema.parse>,
  startTime: number,
) {
  const capability = params.capability as string
  const runtimeConfig = await getUserRuntimeConfig(db, userId, capability, params.configId)

  try {
    const provider = getUserKeyProvider(runtimeConfig)
    const chatResult = await provider.chat({
      model: runtimeConfig.modelId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 1024,
      apiKey: runtimeConfig.apiKey,
    })

    const pricing = await getModelPricing(db, {
      provider: runtimeConfig.providerId,
      modelId: runtimeConfig.modelId,
      activeOnly: false,
    })
    const usageEstimate = estimateBillableUnits({
      category: pricing?.category ?? 'text',
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      messages: params.messages,
      outputText: chatResult.content,
    })

    // 更新 last_used_at
    await db
      .prepare("UPDATE user_api_keys SET last_used_at = datetime('now') WHERE user_id = ? AND provider = ?")
      .bind(userId, runtimeConfig.configId)
      .run()

    // 写日志
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: runtimeConfig.providerId,
      modelId: runtimeConfig.modelId,
      executionMode: 'user_key',
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      billableUnits: usageEstimate.billableUnits,
      estimatedCredits:
        pricing
          ? estimateCreditsFromUsage({
              billableUnits: usageEstimate.billableUnits,
              creditsPer1kUnits: pricing.creditsPer1kUnits,
            })
          : null,
      durationMs: Date.now() - startTime,
      status: 'success',
    })

    return apiOk({ result: chatResult.content })
  } catch (error) {
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: runtimeConfig.providerId,
      modelId: runtimeConfig.modelId,
      executionMode: 'user_key',
      durationMs: Date.now() - startTime,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

async function getUserRuntimeConfig(
  db: D1Database,
  userId: string,
  capability: string,
  configId?: string,
): Promise<UserModelRuntimeConfig> {
  const keyRow = await findUserConfigRow(db, userId, capability, configId)

  if (!keyRow) {
    throw new Error(`No API key configured for capability: ${capability}`)
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(keyRow.configId, decrypted)
  return toRuntimeUserModelConfig(keyRow.configId, payload)
}

function getUserKeyProvider(config: UserModelRuntimeConfig) {
  if (config.providerKind === 'openai-compatible') {
    if (!config.baseUrl) {
      throw new Error('OpenAI-compatible provider requires a base URL')
    }
    return new OpenAICompatibleClient(config.baseUrl)
  }

  if (config.providerKind === 'gemini') {
    return getProvider(config.providerId)
  }

  throw new Error(`Provider kind "${config.providerKind}" is not supported for text execution`)
}

async function findUserConfigRow(
  db: D1Database,
  userId: string,
  capability: string,
  configId?: string,
): Promise<{ encrypted_key: string; configId: string } | null> {
  if (configId) {
    const row = await db
      .prepare(
        'SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
      )
      .bind(userId, configId)
      .first<{ encrypted_key: string }>()

    if (row) {
      return { ...row, configId }
    }
    return null
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const rows = await db
    .prepare(
      'SELECT provider, encrypted_key FROM user_api_keys WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC',
    )
    .bind(userId)
    .all<{ provider: string; encrypted_key: string }>()

  for (const row of rows.results ?? []) {
    const decrypted = await decryptApiKey(String(row.encrypted_key), encryptionKey)
    const payload = deserializeUserModelConfig(String(row.provider), decrypted)
    if (payload.capability === capability) {
      return { encrypted_key: String(row.encrypted_key), configId: String(row.provider) }
    }
  }

  return null
}

/* ─── Usage Log ──────────────────────────────────────── */

interface UsageLogParams {
  userId: string
  workflowId?: string
  nodeId?: string
  provider: string
  modelId: string
  executionMode: string
  inputTokens?: number | null
  outputTokens?: number | null
  billableUnits?: number | null
  estimatedCredits?: number | null
  durationMs: number
  status: string
  errorMessage?: string
}

async function writeUsageLog(db: D1Database, params: UsageLogParams) {
  try {
    await db
      .prepare(
        `INSERT INTO ai_usage_logs (id, user_id, workflow_id, node_id, provider, model_id,
         execution_mode, input_tokens, output_tokens, billable_units, estimated_credits, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nanoid(),
        params.userId,
        params.workflowId ?? null,
        params.nodeId ?? null,
        params.provider,
        params.modelId,
        params.executionMode,
        params.inputTokens ?? null,
        params.outputTokens ?? null,
        params.billableUnits ?? null,
        params.estimatedCredits ?? null,
        params.durationMs,
        params.status,
        params.errorMessage ?? null,
      )
      .run()
  } catch (err) {
    log.warn('Failed to write usage log', { error: err instanceof Error ? err.message : String(err) })
  }
}
