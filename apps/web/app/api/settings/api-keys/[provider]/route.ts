/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/credits, @/lib/db, @/lib/env, @/services/ai/openrouter
 * [OUTPUT]: 对外提供 DELETE (删除) / POST (测试) /api/settings/api-keys/[provider]
 * [POS]: api/settings 的 API Key 单项操作端点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { decryptApiKey } from '@/lib/credits'
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { openRouter } from '@/services/ai/openrouter'

type Params = { params: Promise<{ provider: string }> }

/* ─── DELETE /api/settings/api-keys/[provider] ───────── */

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { provider } = await params
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

    const encryptionKey = await requireEnv('ENCRYPTION_KEY')

    const apiKey = await decryptApiKey(keyRow.encrypted_key, encryptionKey)

    // 目前只支持 OpenRouter 验证
    const valid = await openRouter.validateKey(apiKey)

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
