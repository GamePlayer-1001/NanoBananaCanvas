/**
 * [INPUT]: 依赖 lib/db 的 getDb (D1 查询公开工作流)
 * [OUTPUT]: 对外提供动态 Sitemap (静态路由 + 数据库驱动的动态路由)
 * [POS]: App Router 的 Sitemap 生成器，被搜索引擎爬虫消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'

import { getDb } from '@/lib/db'
import { buildAbsoluteUrl } from '@/lib/seo'

// ─── 常量 ───────────────────────────────────────────────
const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/features', changeFrequency: 'weekly' as const, priority: 0.86 },
  {
    path: '/features/visual-workflow',
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  },
  {
    path: '/features/image-generation',
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  },
  {
    path: '/features/video-generation',
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  },
  { path: '/features/model-routing', changeFrequency: 'weekly' as const, priority: 0.78 },
  { path: '/models', changeFrequency: 'weekly' as const, priority: 0.82 },
  { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/docs', changeFrequency: 'weekly' as const, priority: 0.72 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.58 },
  { path: '/explore', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/workflows', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/video-analysis', changeFrequency: 'weekly' as const, priority: 0.75 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/refund-policy', changeFrequency: 'yearly' as const, priority: 0.28 },
  { path: '/acceptable-use', changeFrequency: 'yearly' as const, priority: 0.28 },
  { path: '/cookie-settings', changeFrequency: 'yearly' as const, priority: 0.24 },
]

// ─── Sitemap 生成 ───────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: buildAbsoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  let dynamicEntries: MetadataRoute.Sitemap = []
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

    dynamicEntries = (results ?? []).map((row) => ({
      url: buildAbsoluteUrl(`/explore/${row.id}`),
      lastModified: new Date(row.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // D1 不可用时静默降级，仍返回静态路由
  }

  return [...staticEntries, ...dynamicEntries]
}
