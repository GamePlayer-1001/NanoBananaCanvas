/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/api-key-crypto, @/lib/db, @/lib/env, @/lib/nanoid,
 *          @/lib/validations/ai, @/lib/user-model-config
 * [OUTPUT]: 对外提供 GET (列表) / PUT (创建/更新) /api/settings/api-keys
 * [POS]: api/settings 的 API Key 管理端点，支持掩码列表 + 加密存储
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { decryptApiKey, encryptApiKey, maskApiKey } from '@/lib/api-key-crypto'
import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { nanoid } from '@/lib/nanoid'
import {
  deserializeUserModelConfig,
  isUserModelConfigSlotId,
  normalizeOpenAIBaseUrl,
  serializeUserModelConfig,
  toPublicUserModelConfig,
} from '@/lib/user-model-config'
import { apiKeySchema } from '@/lib/validations/ai'

/* ─── GET /api/settings/api-keys ─────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const rows = await db
      .prepare(
        `SELECT id, provider, encrypted_key, label, is_active, last_used_at, created_at
         FROM user_api_keys WHERE user_id = ?
         ORDER BY provider ASC`,
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
        const provider = String(row.provider)
        const base = {
          id: row.id,
          provider,
          label: row.label,
          isActive: !!row.is_active,
          lastUsedAt: row.last_used_at,
          createdAt: row.created_at,
        }

        if (!isUserModelConfigSlotId(provider) || typeof row.encrypted_key !== 'string') {
          return base
        }

        const decrypted = await decryptApiKey(row.encrypted_key, encryptionKey)
        const payload = deserializeUserModelConfig(provider, decrypted)

        return {
          ...base,
          ...toPublicUserModelConfig(provider, payload),
        }
      }),
    )

    return apiOk({
      keys,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PUT /api/settings/api-keys ─────────────────────── */

export async function PUT(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const body = await req.json()

    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    if (!provider || !isUserModelConfigSlotId(provider)) {
      return handleApiError(new Error('Provider query parameter is required'))
    }

    const { apiKey, baseUrl, modelId, label } = apiKeySchema.parse(body)

    const encryptionKey = await getEnv('ENCRYPTION_KEY')
    if (!encryptionKey) {
      return apiError('CONFIG_MISSING', 'Server encryption key is not configured', 503)
    }

    const encrypted = await encryptApiKey(
      serializeUserModelConfig({
        version: 1,
        providerKind: provider === 'image-google' ? 'google-image' : 'openai-compatible',
        apiKey,
        modelId,
        baseUrl:
          provider === 'image-google'
            ? undefined
            : normalizeOpenAIBaseUrl(baseUrl ?? ''),
      }),
      encryptionKey,
    )

    // UPSERT: 按 (user_id, provider) 唯一约束
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
      .bind(nanoid(), userId, provider, encrypted, label ?? null)
      .run()

    return apiOk({
      provider,
      maskedKey: maskApiKey(apiKey),
      modelId,
      baseUrl:
        provider === 'image-google'
          ? null
          : normalizeOpenAIBaseUrl(baseUrl ?? ''),
      saved: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
