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
import { SITE_NAME, buildPageMetadata } from '@/lib/seo'

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
    const description =
      row.description ||
      `Reusable AI workflow template for creators and teams on ${SITE_NAME}.`

    return buildPageMetadata({
      title,
      description,
      path: `/explore/${id}`,
      locale,
      type: 'article',
      ogTitle: `${title} | ${SITE_NAME}`,
    })
  } catch {
    return { title: `Explore | ${SITE_NAME}` }
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
