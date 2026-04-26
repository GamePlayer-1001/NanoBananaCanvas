/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/cookies` 公开 Cookie 设置说明页
 * [POS]: (landing) 路由组的隐私辅助页，承接 Footer 中的 Cookie 设置入口
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
  const t = await getTranslations({ locale, namespace: 'sitePages.cookies' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/cookies',
    locale,
  })
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.cookies' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const cookieCards = ['essential', 'analytics', 'preferences'].map((key) => ({
    eyebrow: t(`sections.categories.cards.${key}.eyebrow`),
    title: t(`sections.categories.cards.${key}.title`),
    body: t(`sections.categories.cards.${key}.body`),
    bullets: [1, 2].map((index) => t(`sections.categories.cards.${key}.bullets.${index}`)),
  }))

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        body={t('heroBody')}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.categories.eyebrow')}
        title={t('sections.categories.title')}
        body={t('sections.categories.body')}
      >
        <MarketingCardGrid>
          {cookieCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSiteTree activeHref="/cookies" />
    </MarketingShell>
  )
}
