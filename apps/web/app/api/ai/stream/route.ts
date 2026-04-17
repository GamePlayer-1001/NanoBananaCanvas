/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/db,
 *          @/lib/user-model-config, @/services/ai (Provider 注册表), @/services/ai/openai-compatible,
 *          @/lib/validations/ai, @/lib/api-key-crypto
 * [OUTPUT]: 对外提供 POST /api/ai/stream (平台 Key / user_key 双模式 SSE 流式执行)
 * [POS]: api/ai 的流式端点，统一免费平台执行与账号级模型槽位的 SSE 入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiError, handleApiError, withBodyLimit } from '@/lib/api/response'
import { decryptApiKey } from '@/lib/api-key-crypto'
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

const log = createLogger('ai:stream')

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

    // 确定使用的 API Key
    let apiKey: string
    let resolvedModelId: string
    let runtimeConfig: UserModelRuntimeConfig | null = null
    let providerId: string

    if (params.executionMode === 'user_key') {
      runtimeConfig = await getUserRuntimeConfig(
        db,
        userId,
        params.capability as string,
        params.configId,
      )
      apiKey = runtimeConfig.apiKey
      resolvedModelId = runtimeConfig.modelId
      providerId = runtimeConfig.providerId
    } else {
      providerId = params.provider as string
      resolvedModelId = params.modelId as string
      apiKey = await getPlatformKey(providerId)
    }

    // 通过 Provider 抽象层发起流式调用，转为 SSE
    const provider =
      runtimeConfig
        ? getUserKeyProvider(runtimeConfig)
        : getProvider(providerId)
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // 后台 chatStream → SSE 转发
    // 使用 ctx.waitUntil() 保障 Worker 在流结束后仍存活
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

        await writeUsageLog(
          db,
          userId,
          {
            ...params,
            provider: providerId,
            modelId: resolvedModelId,
          },
          'success',
          Date.now() - startTime,
        )
      } catch (err) {
        await writeUsageLog(
          db,
          userId,
          {
            ...params,
            provider: providerId,
            modelId: resolvedModelId,
          },
          'failed',
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
  capability: string,
  configId?: string,
): Promise<UserModelRuntimeConfig> {
  const keyRow = configId
    ? await db
        .prepare(
          'SELECT provider, encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
        )
        .bind(userId, configId)
        .first<{ provider: string; encrypted_key: string }>()
    : await findFirstCapabilityConfig(db, userId, capability)

  if (!keyRow) {
    throw new Error(`No API key configured for capability: ${capability}`)
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(keyRow.provider, decrypted)
  return toRuntimeUserModelConfig(keyRow.provider, payload)
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

async function findFirstCapabilityConfig(
  db: D1Database,
  userId: string,
  capability: string,
): Promise<{ provider: string; encrypted_key: string } | null> {
  const rows = await db
    .prepare(
      'SELECT provider, encrypted_key FROM user_api_keys WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC',
    )
    .bind(userId)
    .all<{ provider: string; encrypted_key: string }>()

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  for (const row of rows.results ?? []) {
    const decrypted = await decryptApiKey(String(row.encrypted_key), encryptionKey)
    const payload = deserializeUserModelConfig(String(row.provider), decrypted)
    if (payload.capability === capability) {
      return { provider: String(row.provider), encrypted_key: String(row.encrypted_key) }
    }
  }

  return null
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
  durationMs: number,
  errorMessage?: string,
) {
  try {
    await db
      .prepare(
        `INSERT INTO ai_usage_logs (id, user_id, workflow_id, node_id, provider, model_id,
         execution_mode, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nanoid(),
        userId,
        params.workflowId ?? null,
        params.nodeId ?? null,
        params.provider,
        params.modelId,
        params.executionMode,
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
