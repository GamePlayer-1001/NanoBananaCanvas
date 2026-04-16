/**
 * [INPUT]: 依赖 lib/db 的 getDb (D1 查询公开工作流)
 * [OUTPUT]: 对外提供动态 Sitemap (静态路由 + 数据库驱动的动态路由)
 * [POS]: App Router 的 Sitemap 生成器，被搜索引擎爬虫消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'

import { getDb } from '@/lib/db'

// ─── 常量 ───────────────────────────────────────────────
const BASE_URL = 'https://nanobananacanvas.com'
const LOCALES = ['en', 'zh'] as const

// ─── 静态路由 ───────────────────────────────────────────
const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/explore', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/workflows', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
]

// ─── 多语言 URL 生成 ────────────────────────────────────
function buildAlternates(path: string) {
  const languages: Record<string, string> = {}
  for (const locale of LOCALES) {
    languages[locale] = `${BASE_URL}/${locale}${path}`
  }
  languages['x-default'] = `${BASE_URL}/en${path}`
  return { languages }
}

// ─── Sitemap 生成 ───────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静态页面
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}/en${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: buildAlternates(route.path),
  }))

  // 动态页面 — 公开工作流
  let dynamicEntries: MetadataRoute.Sitemap = []
  try {
    const db = await getDb()
    const { results } = await db
      .prepare(
        `SELECT id, updated_at FROM workflows
         WHERE is_public = 1
         ORDER BY updated_at DESC
         LIMIT 5000`
      )
      .all<{ id: string; updated_at: string }>()

    dynamicEntries = (results ?? []).map((row) => ({
      url: `${BASE_URL}/en/explore/${row.id}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: buildAlternates(`/explore/${row.id}`),
    }))
  } catch {
    // D1 不可用时静默降级，仍返回静态路由
  }

  return [...staticEntries, ...dynamicEntries]
}
