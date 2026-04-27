/**
 * [INPUT]: 依赖 lib/db 的 getDb (D1 查询公开工作流)，依赖 i18n/config 与 lib/seo 的多语言 URL 工具
 * [OUTPUT]: 对外提供默认语言 Sitemap，以及可复用的公开 Sitemap 构造器 (静态路由 + 数据库驱动的动态路由 + 多语言 alternates)
 * [POS]: App Router 的根 Sitemap 生成器，主供默认英文索引；同时为其他语言专属 sitemap 提供共享构造逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'

import { getDb } from '@/lib/db'
import { DEFAULT_LOCALE, type AppLocale } from '@/i18n/config'
import { buildLanguageAlternates, buildLocalizedUrl } from '@/lib/seo'

// ─── 常量 ───────────────────────────────────────────────
const STATIC_LAST_MODIFIED_AT = '2026-04-27T00:00:00.000Z'
const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/features', changeFrequency: 'weekly' as const, priority: 0.88 },
  { path: '/models', changeFrequency: 'weekly' as const, priority: 0.88 },
  { path: '/explore', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/workflows', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.68 },
  { path: '/docs', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/community', changeFrequency: 'weekly' as const, priority: 0.72 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/refund-policy', changeFrequency: 'yearly' as const, priority: 0.35 },
  { path: '/acceptable-use', changeFrequency: 'yearly' as const, priority: 0.35 },
  { path: '/cookies', changeFrequency: 'yearly' as const, priority: 0.35 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
]

function buildStaticEntries(locales: readonly AppLocale[]): MetadataRoute.Sitemap {
  return STATIC_ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: buildLocalizedUrl(route.path, locale),
      lastModified: new Date(STATIC_LAST_MODIFIED_AT),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: buildLanguageAlternates(route.path),
      },
    })),
  )
}

async function buildDynamicEntries(
  locales: readonly AppLocale[],
): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getDb()
    const { results } = await db
      .prepare(
        `SELECT id, updated_at FROM workflows
         WHERE is_public = 1
         ORDER BY updated_at DESC
         LIMIT 5000`,
      )
      .all<{ id: string; updated_at: string }>()

    return (results ?? []).flatMap((row) =>
      locales.map((locale) => ({
        url: buildLocalizedUrl(`/explore/${row.id}`, locale),
        lastModified: new Date(row.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
        alternates: {
          languages: buildLanguageAlternates(`/explore/${row.id}`),
        },
      })),
    )
  } catch {
    // D1 不可用时静默降级，仍返回静态路由
    return []
  }
}

export async function buildPublicSitemap(
  locales: readonly AppLocale[],
): Promise<MetadataRoute.Sitemap> {
  const staticEntries = buildStaticEntries(locales)
  const dynamicEntries = await buildDynamicEntries(locales)

  return [...staticEntries, ...dynamicEntries]
}

// ─── Sitemap 生成 ───────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemap([DEFAULT_LOCALE])
}
