/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db，依赖 @/lib/l10n 的业务字段本地化工具，
 *          依赖 @/i18n/config 的启用语言列表
 * [OUTPUT]: 对外提供 GET /api/categories
 * [POS]: api/categories 的分类列表端点，返回全部分类 (支持 locale 参数)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getLocalizedFieldMap, getLocalizedFieldValue } from '@/lib/l10n'
import { AVAILABLE_LANGUAGE_CODES } from '@/i18n/config'

/* ─── GET /api/categories ───────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const locale = url.searchParams.get('locale') ?? 'en'
    const db = await getDb()

    const rows = await db
      .prepare('SELECT id, slug, name_en, name_zh, icon, sort_order FROM categories ORDER BY sort_order')
      .all()

    const items = (rows.results ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      slug: row.slug,
      name: getLocalizedFieldValue(row, 'name', locale),
      translations: getLocalizedFieldMap(row, 'name', AVAILABLE_LANGUAGE_CODES),
      icon: row.icon,
    }))

    return apiOk(items)
  } catch (error) {
    return handleApiError(error)
  }
}
