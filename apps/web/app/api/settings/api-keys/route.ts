/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/api-key-crypto, @/lib/db, @/lib/env, @/lib/nanoid,
 *          @/lib/validations/ai, @/lib/user-model-config
 * [OUTPUT]: 对外提供 GET (列表) / PUT (创建/更新) /api/settings/api-keys
 * [POS]: api/settings 的 API Key 管理端点，支持多条配置列表 + 掩码返回 + 加密存储
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { decryptApiKey, encryptApiKey, maskApiKey } from '@/lib/api-key-crypto'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { nanoid } from '@/lib/nanoid'
import {
  deserializeUserModelConfig,
  isUserModelCapability,
  normalizeOpenAIBaseUrl,
  serializeUserModelConfig,
  toPublicUserModelConfig,
  type UserModelConfigPayload,
} from '@/lib/user-model-config'
import { apiKeySchema } from '@/lib/validations/ai'

/* ─── GET /api/settings/api-keys ─────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const db = await getDb()

    const rows = await db
      .prepare(
        `SELECT id, provider, encrypted_key, label, is_active, last_used_at, created_at
         FROM user_api_keys
         WHERE user_id = ?
         ORDER BY created_at ASC, provider ASC`,
      )
      .bind(userId)
      .all()

    if (!rows.results.length) {
      return apiOk({ keys: [] })
    }

    const encryptionKey = await getEnv('ENCRYPTION_KEY')
    if (!encryptionKey) {
      return apiError('CONFIG_MISSING', 'Server encryption key is not configured', 503)
    }

    const keys = await Promise.all(
      rows.results.map(async (row) => {
        const configId = String(row.provider)
        const decrypted = await decryptApiKey(String(row.encrypted_key), encryptionKey)
        const payload = deserializeUserModelConfig(configId, decrypted)

        return {
          id: String(row.id),
          label: row.label ? String(row.label) : null,
          isActive: !!row.is_active,
          lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
          createdAt: row.created_at ? String(row.created_at) : null,
          ...toPublicUserModelConfig(configId, payload, maskApiKey(payload.apiKey)),
        }
      }),
    )

    return apiOk({ keys })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PUT /api/settings/api-keys ─────────────────────── */

export async function PUT(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuthenticatedAuth()
    const db = await getDb()
    const body = await req.json()

    const capability = new URL(req.url).searchParams.get('provider')
    if (!capability || !isUserModelCapability(capability)) {
      return apiError('VALIDATION_FAILED', 'Capability query parameter is required', 400)
    }

    const parsed = apiKeySchema.parse(body)
    if (parsed.capability !== capability) {
      return apiError('VALIDATION_FAILED', 'Capability mismatch', 400)
    }

    const encryptionKey = await getEnv('ENCRYPTION_KEY')
    if (!encryptionKey) {
      return apiError('CONFIG_MISSING', 'Server encryption key is not configured', 503)
    }

    const configId = parsed.configId?.trim() || `${capability}_${nanoid(10)}`
    const existingRow = await db
      .prepare(
        `SELECT encrypted_key
         FROM user_api_keys
         WHERE user_id = ? AND provider = ?`,
      )
      .bind(userId, configId)
      .first<{ encrypted_key: string }>()

    const existingConfig = existingRow?.encrypted_key
      ? deserializeUserModelConfig(
          configId,
          await decryptApiKey(existingRow.encrypted_key, encryptionKey),
        )
      : null

    const normalizedBaseUrl =
      parsed.providerKind === 'openai-compatible' || parsed.providerKind === 'openrouter'
        ? normalizeOpenAIBaseUrl(parsed.baseUrl ?? '')
        : undefined

    const nextConfig: UserModelConfigPayload = {
      version: 4,
      capability,
      providerKind: parsed.providerKind,
      providerId: parsed.providerId,
      apiKey: parsed.apiKey || existingConfig?.apiKey || '',
      secretKey: parsed.secretKey || existingConfig?.secretKey,
      modelId: parsed.modelId,
      baseUrl: normalizedBaseUrl,
      imageCapabilities:
        capability === 'image'
          ? parsed.imageCapabilities ?? existingConfig?.imageCapabilities
          : undefined,
    }

    if (!nextConfig.apiKey) {
      return apiError('VALIDATION_FAILED', 'API key is required', 400)
    }

    if (parsed.providerKind === 'kling' && !nextConfig.secretKey) {
      return apiError('VALIDATION_FAILED', 'Secret key is required for Kling', 400)
    }

    if (
      (parsed.providerKind === 'openai-compatible' || parsed.providerKind === 'openrouter') &&
      !nextConfig.baseUrl
    ) {
      return apiError(
        'VALIDATION_FAILED',
        'Base URL is required for OpenAI-compatible/OpenRouter providers',
        400,
      )
    }

    const encrypted = await encryptApiKey(serializeUserModelConfig(nextConfig), encryptionKey)

    await db
      .prepare(
        `INSERT INTO user_api_keys (id, user_id, provider, encrypted_key, label)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, provider) DO UPDATE SET
           encrypted_key = excluded.encrypted_key,
           label = excluded.label,
           is_active = 1,
           updated_at = datetime('now')`,
      )
      .bind(nanoid(), userId, configId, encrypted, parsed.name)
      .run()

    return apiOk({
      configId,
      capability,
      name: parsed.name,
      maskedKey: maskApiKey(nextConfig.apiKey),
      providerKind: parsed.providerKind,
      providerId: parsed.providerId,
      modelId: parsed.modelId,
      baseUrl: nextConfig.baseUrl ?? null,
      hasSecretKey: !!nextConfig.secretKey,
      imageCapabilities: nextConfig.imageCapabilities ?? null,
      saved: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
