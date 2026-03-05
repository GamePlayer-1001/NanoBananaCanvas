/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/credits, @/lib/db, @/lib/nanoid, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET (列表) / PUT (创建/更新) /api/settings/api-keys
 * [POS]: api/settings 的 API Key 管理端点，支持掩码列表 + 加密存储
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { encryptApiKey, maskApiKey } from '@/lib/credits'
import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'
import { apiKeySchema } from '@/lib/validations/ai'

/* ─── GET /api/settings/api-keys ─────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const rows = await db
      .prepare(
        `SELECT id, provider, label, is_active, last_used_at, created_at
         FROM user_api_keys WHERE user_id = ?
         ORDER BY provider ASC`,
      )
      .bind(userId)
      .all()

    return apiOk({
      keys: rows.results.map((row) => ({
        id: row.id,
        provider: row.provider,
        label: row.label,
        isActive: !!row.is_active,
        lastUsedAt: row.last_used_at,
        createdAt: row.created_at,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PUT /api/settings/api-keys ─────────────────────── */

export async function PUT(req: Request) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const body = await req.json()

    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    if (!provider) {
      return handleApiError(new Error('Provider query parameter is required'))
    }

    const { apiKey, label } = apiKeySchema.parse(body)

    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) throw new Error('ENCRYPTION_KEY not configured')

    const encrypted = await encryptApiKey(apiKey, encryptionKey)

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
      saved: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
