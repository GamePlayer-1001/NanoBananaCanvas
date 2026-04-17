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
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import {
  deserializeUserModelConfig,
  getSlotLookupOrder,
  isUserModelConfigSlotId,
  toRuntimeUserModelConfig,
  type UserModelConfigSlotId,
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
  try {
    const platformKey = await getPlatformKey(params.provider)
    const provider = getProvider(params.provider)

    const chatResult = await provider.chat({
      model: params.modelId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 1024,
      apiKey: platformKey,
    })

    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: params.modelId,
      executionMode: 'platform',
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      durationMs: Date.now() - startTime,
      status: 'success',
    })

    return apiOk({ result: chatResult.content })
  } catch (error) {
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: params.modelId,
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
  const runtimeConfig = await getUserRuntimeConfig(db, userId, params.provider)

  try {
    const provider = getUserKeyProvider(runtimeConfig)
    const chatResult = await provider.chat({
      model: runtimeConfig.modelId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 1024,
      apiKey: runtimeConfig.apiKey,
    })

    // 更新 last_used_at
    await db
      .prepare("UPDATE user_api_keys SET last_used_at = datetime('now') WHERE user_id = ? AND provider = ?")
      .bind(userId, runtimeConfig.slotId)
      .run()

    // 写日志
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      modelId: runtimeConfig.modelId,
      executionMode: 'user_key',
      inputTokens: chatResult.usage?.promptTokens ?? null,
      outputTokens: chatResult.usage?.completionTokens ?? null,
      durationMs: Date.now() - startTime,
      status: 'success',
    })

    return apiOk({ result: chatResult.content })
  } catch (error) {
    await writeUsageLog(db, {
      userId,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
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
  provider: string,
): Promise<UserModelRuntimeConfig> {
  if (!isUserModelConfigSlotId(provider)) {
    throw new Error(`Unsupported user_key provider slot: ${provider}`)
  }

  const keyRow = await findUserConfigRow(db, userId, provider)

  if (!keyRow) {
    throw new Error('No API key configured for this provider')
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(keyRow.slotId, decrypted)
  return toRuntimeUserModelConfig(keyRow.slotId, payload)
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
  slotId: UserModelConfigSlotId,
): Promise<{ encrypted_key: string; slotId: UserModelConfigSlotId } | null> {
  for (const candidate of getSlotLookupOrder(slotId)) {
    const row = await db
      .prepare(
        'SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
      )
      .bind(userId, candidate)
      .first<{ encrypted_key: string }>()

    if (row) {
      return { ...row, slotId: candidate }
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
  durationMs: number
  status: string
  errorMessage?: string
}

async function writeUsageLog(db: D1Database, params: UsageLogParams) {
  try {
    await db
      .prepare(
        `INSERT INTO ai_usage_logs (id, user_id, workflow_id, node_id, provider, model_id,
         execution_mode, input_tokens, output_tokens, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        params.durationMs,
        params.status,
        params.errorMessage ?? null,
      )
      .run()
  } catch (err) {
    log.warn('Failed to write usage log', { error: err instanceof Error ? err.message : String(err) })
  }
}
