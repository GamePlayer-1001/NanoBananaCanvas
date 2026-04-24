/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/docs` 公开文档导航页
 * [POS]: (landing) 路由组的资源入口页，承接导航 Resources 中的文档入口
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
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sitePages.docs' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/docs',
    locale,
  })
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.docs' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const quickStartCards = ['start', 'models', 'pricing'].map((key) => ({
    eyebrow: t(`sections.quickStart.cards.${key}.eyebrow`),
    title: t(`sections.quickStart.cards.${key}.title`),
    body: t(`sections.quickStart.cards.${key}.body`),
    href: t(`sections.quickStart.cards.${key}.href`),
    actionLabel: t(`sections.quickStart.cards.${key}.action`),
  }))

  const operatingCards = ['workflow', 'assets', 'team'].map((key) => ({
    eyebrow: t(`sections.operating.cards.${key}.eyebrow`),
    title: t(`sections.operating.cards.${key}.title`),
    body: t(`sections.operating.cards.${key}.body`),
  }))

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        body={t('heroBody')}
        links={[
          { label: t('primaryCta'), href: '/features' },
          { label: t('secondaryCta'), href: '/contact', variant: 'secondary' },
        ]}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.quickStart.eyebrow')}
        title={t('sections.quickStart.title')}
        body={t('sections.quickStart.body')}
      >
        <MarketingCardGrid>
          {quickStartCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.operating.eyebrow')}
        title={t('sections.operating.title')}
        body={t('sections.operating.body')}
      >
        <MarketingCardGrid>
          {operatingCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingActionStrip
        title={t('footerCta.title')}
        body={t('footerCta.body')}
        links={[
          { label: t('footerCta.primary'), href: '/sign-in' },
          { label: t('footerCta.secondary'), href: '/community', variant: 'secondary' },
        ]}
      />
    </MarketingShell>
  )
}
