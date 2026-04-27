/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/explore/explore-content 的 ExploreContent，
 *          依赖 @/lib/seo 的 metadata/URL/关键词工具
 * [OUTPUT]: 对外提供 Explore 社区广场页面 + SEO metadata + CollectionPage/BreadcrumbList 结构化数据
 * [POS]: (app) 路由组的探索页，展示社区视频/工作流并承接 `gpt image` 工作流模板搜索意图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ExploreContent } from '@/components/explore/explore-content'
import {
  SITE_NAME,
  buildAbsoluteUrl,
  buildPriorityKeywords,
  buildPageMetadata,
} from '@/lib/seo'

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
    keywords: buildPriorityKeywords(locale, [
      'AI workflow templates',
      'gpt image templates',
      'image generation workflows',
      'creator workflow library',
    ]),
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
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const keywords = buildPriorityKeywords(locale, [
    'AI workflow templates',
    'gpt image templates',
    'image generation workflows',
    'creator workflow library',
  ])
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('exploreTitle'),
      description: t('exploreDescription'),
      url: buildAbsoluteUrl('/explore'),
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: buildAbsoluteUrl('/'),
      },
      about: [
        { '@type': 'Thing', name: 'gpt image' },
        { '@type': 'Thing', name: 'gpt image workflow' },
        { '@type': 'Thing', name: 'AI workflow template' },
      ],
      keywords: keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: buildAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('exploreTitle'),
          item: buildAbsoluteUrl('/explore'),
        },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExploreContent />
    </>
  )
}
