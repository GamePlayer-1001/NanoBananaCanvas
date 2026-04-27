/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，依赖 @/components/explore/detail/explore-detail-content，
 *          依赖 @/lib/db，依赖 @/lib/seo 的 metadata/URL/OG/关键词工具
 * [OUTPUT]: 对外提供 ExploreDetailPage 详情页 (SSR shell) + SEO metadata + CreativeWork/BreadcrumbList 结构化数据
 * [POS]: (app) 路由组的探索详情页，展示公开工作流详情并承接 GPT Image 工作流模板搜索意图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { ExploreDetailContent } from '@/components/explore/detail/explore-detail-content'
import { getDb } from '@/lib/db'
import {
  GPT_IMAGE_PRIORITY_KEYWORDS,
  SITE_NAME,
  buildAbsoluteUrl,
  buildOgImageUrl,
  buildPageMetadata,
  mergeKeywords,
} from '@/lib/seo'

interface PublicWorkflowSeoRecord {
  id: string
  name: string
  description: string | null
  author_name: string | null
  published_at: string | null
  updated_at: string | null
  view_count: number | null
  like_count: number | null
  clone_count: number | null
}

function buildWorkflowDescription(record: Pick<PublicWorkflowSeoRecord, 'description'>) {
  return record.description?.trim()
    ? `${record.description.trim()} Reusable GPT Image and multimodal workflow template on ${SITE_NAME}.`
    : `Reusable GPT Image and multimodal AI workflow template for creators and teams on ${SITE_NAME}.`
}

function buildWorkflowOgSubtitle(
  record: Pick<
    PublicWorkflowSeoRecord,
    'author_name' | 'like_count' | 'clone_count' | 'view_count'
  >,
) {
  const author = record.author_name
    ? `By ${record.author_name}`
    : 'Public workflow template'
  const signals = [
    `${record.view_count ?? 0} views`,
    `${record.like_count ?? 0} likes`,
    `${record.clone_count ?? 0} clones`,
  ].join(' · ')

  return `${author} · GPT Image workflow template · ${signals}`
}

async function getPublicWorkflowSeoRecord(id: string) {
  const db = await getDb()

  return db
    .prepare(
      `SELECT w.id, w.name, w.description, w.published_at, w.updated_at,
              w.view_count, w.like_count, w.clone_count,
              u.name AS author_name
       FROM workflows w
       JOIN users u ON u.id = w.user_id
       WHERE w.id = ? AND w.is_public = 1`,
    )
    .bind(id)
    .first<PublicWorkflowSeoRecord>()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  try {
    const row = await getPublicWorkflowSeoRecord(id)
    if (!row) return { title: 'Workflow Not Found' }
    const title = `${row.name} | GPT Image workflow template`
    const description = buildWorkflowDescription(row)
    const keywords = mergeKeywords(GPT_IMAGE_PRIORITY_KEYWORDS, [
      row.name,
      'AI workflow template',
      'image generation workflow',
      'multimodal workflow',
    ])

    return buildPageMetadata({
      title,
      description,
      path: `/explore/${id}`,
      locale,
      type: 'article',
      ogTitle: `${title} | ${SITE_NAME}`,
      ogSubtitle: buildWorkflowOgSubtitle(row),
      keywords,
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

  const workflow = await getPublicWorkflowSeoRecord(id).catch(() => null)

  const keywords = workflow
    ? mergeKeywords(GPT_IMAGE_PRIORITY_KEYWORDS, [
        workflow.name,
        'AI workflow template',
        'image generation workflow',
        'multimodal workflow',
      ])
    : GPT_IMAGE_PRIORITY_KEYWORDS
  const description = workflow
    ? buildWorkflowDescription(workflow)
    : `Reusable GPT Image and multimodal AI workflow templates on ${SITE_NAME}.`
  const jsonLd = workflow
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: workflow.name,
          description,
          url: buildAbsoluteUrl(`/explore/${id}`),
          image: buildOgImageUrl(workflow.name, description),
          datePublished: workflow.published_at ?? undefined,
          dateModified: workflow.updated_at ?? undefined,
          isAccessibleForFree: true,
          keywords: keywords.join(', '),
          genre: 'AI workflow template',
          author: workflow.author_name
            ? {
                '@type': 'Person',
                name: workflow.author_name,
              }
            : undefined,
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
          about: [
            { '@type': 'Thing', name: 'gpt image' },
            { '@type': 'Thing', name: 'gpt image workflow' },
            { '@type': 'Thing', name: 'AI workflow template' },
          ],
          interactionStatistic: [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/ViewAction',
              userInteractionCount: workflow.view_count ?? 0,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/LikeAction',
              userInteractionCount: workflow.like_count ?? 0,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/CopyAction',
              userInteractionCount: workflow.clone_count ?? 0,
            },
          ],
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
              name: 'Explore',
              item: buildAbsoluteUrl('/explore'),
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: workflow.name,
              item: buildAbsoluteUrl(`/explore/${id}`),
            },
          ],
        },
      ]
    : null

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ExploreDetailContent workflowId={id} />
    </>
  )
}
