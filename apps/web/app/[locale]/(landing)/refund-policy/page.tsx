/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/refund-policy` 公开退款政策页面
 * [POS]: (landing) 路由组的法务辅助页，为 Footer 法务链接提供真实承接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import {
  MarketingCard,
  MarketingCardGrid,
  MarketingHero,
  MarketingSection,
  MarketingShell,
} from '@/components/landing/public-pages'
import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sitePages.refundPolicy' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/refund-policy',
    locale,
  })
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.refundPolicy' })
  const navT = await getTranslations({ locale, namespace: 'landing.nav' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const policyCards = ['subscriptions', 'oneTime', 'creditPacks', 'exceptions'].map((key) => ({
    eyebrow: t(`sections.rules.cards.${key}.eyebrow`),
    title: t(`sections.rules.cards.${key}.title`),
    body: t(`sections.rules.cards.${key}.body`),
    bullets: [1, 2].map((index) => t(`sections.rules.cards.${key}.bullets.${index}`)),
  }))

  return (
    <MarketingShell backHomeLabel={navT('backHome')}>
      <MarketingHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        body={t('heroBody')}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.rules.eyebrow')}
        title={t('sections.rules.title')}
        body={t('sections.rules.body')}
      >
        <MarketingCardGrid columns={2}>
          {policyCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSiteTree activeHref="/refund-policy" />
    </MarketingShell>
  )
}
