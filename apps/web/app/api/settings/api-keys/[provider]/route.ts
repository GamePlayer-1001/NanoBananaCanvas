/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/api-key-crypto, @/lib/db, @/lib/env,
 *          @/lib/user-model-config, @/services/ai/openai-compatible
 * [OUTPUT]: 对外提供 DELETE (删除) / POST (测试) /api/settings/api-keys/[provider]
 * [POS]: api/settings 的 API Key 单项操作端点，按配置记录 ID 删除或连通测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { decryptApiKey } from '@/lib/api-key-crypto'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import {
  deserializeUserModelConfig,
  type UserModelConfigPayload,
} from '@/lib/user-model-config'
import { GeminiClient } from '@/services/ai/gemini'
import { OpenAICompatibleClient } from '@/services/ai/openai-compatible'

type Params = { params: Promise<{ provider: string }> }

/* ─── DELETE /api/settings/api-keys/[provider] ───────── */

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { provider: configId } = await params
    const db = await getDb()

    const result = await db
      .prepare('DELETE FROM user_api_keys WHERE user_id = ? AND provider = ?')
      .bind(userId, configId)
      .run()

    if (!(result.meta.changes ?? 0)) {
      return apiError('NOT_FOUND', `No API key found for config: ${configId}`, 404)
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
    const { provider: configId } = await params
    const db = await getDb()

    const keyRow = await db
      .prepare(
        `SELECT encrypted_key
         FROM user_api_keys
         WHERE user_id = ? AND provider = ? AND is_active = 1`,
      )
      .bind(userId, configId)
      .first<{ encrypted_key: string }>()

    if (!keyRow) {
      return apiError('NOT_FOUND', `No API key found for config: ${configId}`, 404)
    }

    const encryptionKey = await getEnv('ENCRYPTION_KEY')
    if (!encryptionKey) {
      return apiError('CONFIG_MISSING', 'Server encryption key is not configured', 503)
    }

    const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
    const config = deserializeUserModelConfig(configId, decrypted)
    const valid = await validateConfig(config)

    if (valid) {
      await db
        .prepare(
          "UPDATE user_api_keys SET last_used_at = datetime('now') WHERE user_id = ? AND provider = ?",
        )
        .bind(userId, configId)
        .run()
    }

    return apiOk({ valid, configId })
  } catch (error) {
    return handleApiError(error)
  }
}

async function validateConfig(config: UserModelConfigPayload): Promise<boolean> {
  switch (config.providerKind) {
    case 'google-image':
    case 'gemini':
      return new GeminiClient().validateKey(config.apiKey)
    case 'openai-audio':
      return new OpenAICompatibleClient('https://api.openai.com/v1').validateKey(config.apiKey)
    case 'kling':
      return Boolean(config.apiKey.trim() && config.secretKey?.trim())
    case 'openai-compatible':
      if (!config.baseUrl) return false
      return new OpenAICompatibleClient(config.baseUrl).validateKey(config.apiKey)
    default:
      return false
  }
}
