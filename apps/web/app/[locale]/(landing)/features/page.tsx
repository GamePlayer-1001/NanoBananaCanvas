/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/features` 公开功能详情页
 * [POS]: (landing) 路由组的功能详情页，为导航与 SEO 承接产品能力说明
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
import { buildPageMetadata, buildPriorityKeywords } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sitePages.features' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/features',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'visual AI workflow',
      'image workflow builder',
      'AI canvas',
    ]),
  })
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.features' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const orchestrationCards = ['canvas', 'branching', 'handoff'].map((key) => ({
    eyebrow: t(`sections.orchestration.cards.${key}.eyebrow`),
    title: t(`sections.orchestration.cards.${key}.title`),
    body: t(`sections.orchestration.cards.${key}.body`),
  }))

  const productionCards = ['image', 'video', 'library'].map((key) => ({
    eyebrow: t(`sections.production.cards.${key}.eyebrow`),
    title: t(`sections.production.cards.${key}.title`),
    body: t(`sections.production.cards.${key}.body`),
    bullets: [1, 2, 3].map((index) =>
      t(`sections.production.cards.${key}.bullets.${index}`),
    ),
  }))

  const teamCards = ['roles', 'ops', 'handover'].map((key) => ({
    eyebrow: t(`sections.team.cards.${key}.eyebrow`),
    title: t(`sections.team.cards.${key}.title`),
    body: t(`sections.team.cards.${key}.body`),
  }))

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        body={t('heroBody')}
        links={[
          { label: t('primaryCta'), href: '/sign-in' },
          { label: t('secondaryCta'), href: '/models', variant: 'secondary' },
        ]}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.orchestration.eyebrow')}
        title={t('sections.orchestration.title')}
        body={t('sections.orchestration.body')}
      >
        <MarketingCardGrid>
          {orchestrationCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.production.eyebrow')}
        title={t('sections.production.title')}
        body={t('sections.production.body')}
      >
        <MarketingCardGrid>
          {productionCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.team.eyebrow')}
        title={t('sections.team.title')}
        body={t('sections.team.body')}
      >
        <MarketingCardGrid>
          {teamCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingActionStrip
        title={t('footerCta.title')}
        body={t('footerCta.body')}
        links={[
          { label: t('footerCta.primary'), href: '/pricing' },
          { label: t('footerCta.secondary'), href: '/docs', variant: 'secondary' },
        ]}
      />

      <MarketingSiteTree activeHref="/features" />
    </MarketingShell>
  )
}
