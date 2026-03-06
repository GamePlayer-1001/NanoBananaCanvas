/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/explore/detail/explore-detail-content
 * [OUTPUT]: 对外提供 ExploreDetailPage 详情页 (SSR shell)
 * [POS]: (app) 路由组的探索详情页，展示公开工作流详情
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { ExploreDetailContent } from '@/components/explore/detail/explore-detail-content'

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
