/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/explore/explore-content 的 ExploreContent
 * [OUTPUT]: 对外提供 Explore 社区广场页面
 * [POS]: (app) 路由组的探索页，展示社区视频/工作流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ExploreContent } from '@/components/explore/explore-content'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return buildPageMetadata({
    title: t('exploreTitle'),
    description: t('exploreDescription'),
    path: '/explore',
    locale,
  })
}

/* ─── Page ───────────────────────────────────────────── */

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ExploreContent />
}
