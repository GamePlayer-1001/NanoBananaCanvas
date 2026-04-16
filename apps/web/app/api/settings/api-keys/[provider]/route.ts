/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/api-key-crypto, @/lib/db, @/lib/env,
 *          @/lib/user-model-config, @/services/ai/openai-compatible
 * [OUTPUT]: 对外提供 DELETE (删除) / POST (测试) /api/settings/api-keys/[provider]
 * [POS]: api/settings 的 API Key 单项操作端点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { decryptApiKey } from '@/lib/api-key-crypto'
import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import {
  deserializeUserModelConfig,
  isUserModelConfigSlotId,
  type UserModelConfigPayload,
  type UserModelConfigSlotId,
} from '@/lib/user-model-config'
import { OpenAICompatibleClient } from '@/services/ai/openai-compatible'
import { GeminiClient } from '@/services/ai/gemini'

type Params = { params: Promise<{ provider: string }> }

/* ─── DELETE /api/settings/api-keys/[provider] ───────── */

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { provider } = await params
    if (!isUserModelConfigSlotId(provider)) {
      return apiError('NOT_FOUND', `Unsupported provider slot: ${provider}`, 404)
    }
    const db = await getDb()

    const result = await db
      .prepare('DELETE FROM user_api_keys WHERE user_id = ? AND provider = ?')
      .bind(userId, provider)
      .run()

    if (!result.meta.changes) {
      return apiError('NOT_FOUND', `No API key found for provider: ${provider}`, 404)
    }

    return apiOk({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── POST /api/settings/api-keys/[provider] (test) ─── */

export async function POST(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { provider } = await params
    if (!isUserModelConfigSlotId(provider)) {
      return apiError('NOT_FOUND', `Unsupported provider slot: ${provider}`, 404)
    }
    const db = await getDb()

    const keyRow = await db
      .prepare(
        'SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? AND is_active = 1',
      )
      .bind(userId, provider)
      .first<{ encrypted_key: string }>()

    if (!keyRow) {
      return apiError('NOT_FOUND', `No API key found for provider: ${provider}`, 404)
    }

    const encryptionKey = await getEnv('ENCRYPTION_KEY')
    if (!encryptionKey) {
      return apiError('CONFIG_MISSING', 'Server encryption key is not configured', 503)
    }

    const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
    const config = deserializeUserModelConfig(provider, decrypted)
    const valid = await validateSlotConfig(provider, config)

    // 更新 last_used_at
    if (valid) {
      await db
        .prepare("UPDATE user_api_keys SET last_used_at = datetime('now') WHERE user_id = ? AND provider = ?")
        .bind(userId, provider)
        .run()
    }

    return apiOk({ valid, provider })
  } catch (error) {
    return handleApiError(error)
  }
}

async function validateSlotConfig(
  provider: UserModelConfigSlotId,
  config: UserModelConfigPayload,
): Promise<boolean> {
  if (provider === 'image-google') {
    return new GeminiClient().validateKey(config.apiKey)
  }

  if (!config.baseUrl) {
    return false
  }

  return new OpenAICompatibleClient(config.baseUrl).validateKey(config.apiKey)
}
