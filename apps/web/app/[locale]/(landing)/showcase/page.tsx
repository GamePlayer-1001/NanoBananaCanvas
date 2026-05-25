/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/showcase-content 的 ShowcaseContent，
 *          依赖 @/lib/seo 的 metadata/URL 工具
 * [OUTPUT]: 对外提供 Showcase 公开探索页面 + SEO metadata
 * [POS]: (landing) 路由组的公开探索展示页，展示社区作品快照（暗色调、无需登录、静态缓存）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ShowcaseContent } from '@/components/landing/showcase-content'
import { buildPageMetadata, buildPriorityKeywords } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing.showcase' })
  return buildPageMetadata({
    title: t('title'),
    description: t('subtitle'),
    path: '/showcase',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'AI workflow showcase',
      'community creations',
      'gpt image gallery',
      'AI art gallery',
    ]),
  })
}

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ShowcaseContent />
}
