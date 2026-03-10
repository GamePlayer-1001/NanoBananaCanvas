/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/explore/detail/explore-detail-content
 * [OUTPUT]: 对外提供 ExploreDetailPage 详情页 (SSR shell)
 * [POS]: (app) 路由组的探索详情页，展示公开工作流详情
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { ExploreDetailContent } from '@/components/explore/detail/explore-detail-content'
import { getDb } from '@/lib/db'

const BASE_URL = 'https://nanobananacanvas.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  try {
    const db = await getDb()
    const row = await db
      .prepare('SELECT name, description FROM workflows WHERE id = ? AND is_public = 1')
      .bind(id)
      .first<{ name: string; description: string | null }>()
    if (!row) return { title: 'Workflow Not Found' }
    const title = row.name
    const description = row.description || `AI workflow "${row.name}" on Nano Banana Canvas`
    return {
      title,
      description,
      alternates: {
        canonical: `${BASE_URL}/${locale}/explore/${id}`,
        languages: {
          en: `${BASE_URL}/en/explore/${id}`,
          zh: `${BASE_URL}/zh/explore/${id}`,
        },
      },
      openGraph: {
        title: `${title} | Nano Banana Canvas`,
        description,
        url: `${BASE_URL}/${locale}/explore/${id}`,
        siteName: 'Nano Banana Canvas',
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    return { title: 'Explore | Nano Banana Canvas' }
  }
}

/* ─── Page ───────────────────────────────────────────── */

export default async function ExploreDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <ExploreDetailContent workflowId={id} />
}
