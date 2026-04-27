/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/workflows/workflows-content，
 *          依赖 @/lib/seo 的 metadata/URL/关键词工具
 * [OUTPUT]: 对外提供 Workflows 工作流分享页面 + SEO metadata + CollectionPage/BreadcrumbList 结构化数据
 * [POS]: (app) 路由组的工作流页，展示社区分享的工作流并承接 `gpt image` 工作流库搜索意图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { WorkflowsContent } from '@/components/workflows/workflows-content'
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
    title: t('workflowsTitle'),
    description: t('workflowsDescription'),
    path: '/workflows',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'AI workflow library',
      'gpt image workflow library',
      'reusable workflow templates',
      'image generation workflows',
    ]),
  })
}

/* ─── Page ───────────────────────────────────────────── */

export default async function WorkflowsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const keywords = buildPriorityKeywords(locale, [
    'AI workflow library',
    'gpt image workflow library',
    'reusable workflow templates',
    'image generation workflows',
  ])
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('workflowsTitle'),
      description: t('workflowsDescription'),
      url: buildAbsoluteUrl('/workflows'),
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: buildAbsoluteUrl('/'),
      },
      about: [
        { '@type': 'Thing', name: 'gpt image' },
        { '@type': 'Thing', name: 'gpt image workflow' },
        { '@type': 'Thing', name: 'AI workflow library' },
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
          name: t('workflowsTitle'),
          item: buildAbsoluteUrl('/workflows'),
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
      <WorkflowsContent />
    </>
  )
}
