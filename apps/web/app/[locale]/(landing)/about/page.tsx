/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/about` 公开关于我们页面 + SEO metadata + AboutPage/BreadcrumbList 结构化数据
 * [POS]: (landing) 路由组的品牌与团队定位页，为 Footer 公司信息和 SEO 承接叙事
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
  const t = await getTranslations({ locale, namespace: 'sitePages.about' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/about',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'about Nano Banana Canvas',
      'AI workflow company',
      'visual AI workflow platform',
    ]),
  })
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.about' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const principleCards = ['clarity', 'systems', 'taste'].map((key) => ({
    eyebrow: t(`sections.principles.cards.${key}.eyebrow`),
    title: t(`sections.principles.cards.${key}.title`),
    body: t(`sections.principles.cards.${key}.body`),
  }))

  const buildCards = ['operators', 'shared', 'shipping'].map((key) => ({
    eyebrow: t(`sections.build.cards.${key}.eyebrow`),
    title: t(`sections.build.cards.${key}.title`),
    body: t(`sections.build.cards.${key}.body`),
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: t('metaTitle'),
      description: t('metaDescription'),
      url: buildAbsoluteUrl('/about'),
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: buildAbsoluteUrl('/'),
      },
      about: [
        { '@type': 'Thing', name: 'gpt image' },
        { '@type': 'Thing', name: 'AI workflow platform' },
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
          item: buildAbsoluteUrl('/about'),
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
          { label: t('primaryCta'), href: '/contact' },
          { label: t('secondaryCta'), href: '/community', variant: 'secondary' },
        ]}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.principles.eyebrow')}
        title={t('sections.principles.title')}
        body={t('sections.principles.body')}
      >
        <MarketingCardGrid>
          {principleCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.build.eyebrow')}
        title={t('sections.build.title')}
        body={t('sections.build.body')}
      >
        <MarketingCardGrid>
          {buildCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingActionStrip
        title={t('footerCta.title')}
        body={t('footerCta.body')}
        links={[
          { label: t('footerCta.primary'), href: '/docs' },
          { label: t('footerCta.secondary'), href: '/sign-in', variant: 'secondary' },
        ]}
      />

      <MarketingSiteTree activeHref="/about" />
    </MarketingShell>
  )
}
