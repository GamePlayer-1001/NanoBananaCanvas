/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/community` 公开社区说明页 + SEO metadata + CollectionPage/BreadcrumbList 结构化数据
 * [POS]: (landing) 路由组的资源页，承接社区入口并引导到 explore/workflows
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
  MarketingActionStrip,
  MarketingCard,
  MarketingCardGrid,
  MarketingHero,
  MarketingSection,
  MarketingShell,
} from '@/components/landing/public-pages'
import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import {
  SITE_NAME,
  buildAbsoluteUrl,
  buildPageMetadata,
  buildPriorityKeywords,
} from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sitePages.community' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/community',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'gpt image community',
      'AI workflow community',
      'creator workflow sharing',
    ]),
  })
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.community' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const shareCards = ['explore', 'workflow', 'feedback'].map((key) => ({
    eyebrow: t(`sections.share.cards.${key}.eyebrow`),
    title: t(`sections.share.cards.${key}.title`),
    body: t(`sections.share.cards.${key}.body`),
  }))

  const participationCards = ['operators', 'templates', 'support'].map((key) => ({
    eyebrow: t(`sections.participation.cards.${key}.eyebrow`),
    title: t(`sections.participation.cards.${key}.title`),
    body: t(`sections.participation.cards.${key}.body`),
    href: t(`sections.participation.cards.${key}.href`),
    actionLabel: t(`sections.participation.cards.${key}.action`),
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('metaTitle'),
      description: t('metaDescription'),
      url: buildAbsoluteUrl('/community'),
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: buildAbsoluteUrl('/'),
      },
      about: [
        { '@type': 'Thing', name: 'gpt image' },
        { '@type': 'Thing', name: 'AI workflow community' },
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
          name: t('metaTitle'),
          item: buildAbsoluteUrl('/community'),
        },
      ],
    },
  ]

  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        body={t('heroBody')}
        links={[
          { label: t('primaryCta'), href: '/explore' },
          { label: t('secondaryCta'), href: '/workflows', variant: 'secondary' },
        ]}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.share.eyebrow')}
        title={t('sections.share.title')}
        body={t('sections.share.body')}
      >
        <MarketingCardGrid>
          {shareCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.participation.eyebrow')}
        title={t('sections.participation.title')}
        body={t('sections.participation.body')}
      >
        <MarketingCardGrid>
          {participationCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingActionStrip
        title={t('footerCta.title')}
        body={t('footerCta.body')}
        links={[
          { label: t('footerCta.primary'), href: '/contact' },
          { label: t('footerCta.secondary'), href: '/docs', variant: 'secondary' },
        ]}
      />

      <MarketingSiteTree activeHref="/community" />
    </MarketingShell>
  )
}
