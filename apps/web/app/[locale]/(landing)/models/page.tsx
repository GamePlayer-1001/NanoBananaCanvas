/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/public-pages，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 `/models` 公开模型罗列页
 * [POS]: (landing) 路由组的模型支持页，为导航、SEO 与模型云图区提供落地承接
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
import { GPT_IMAGE_PRIORITY_KEYWORDS, buildPageMetadata, mergeKeywords } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sitePages.models' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/models',
    locale,
    keywords: mergeKeywords(GPT_IMAGE_PRIORITY_KEYWORDS, [
      'AI model directory',
      'OpenAI image workflow',
      'multimodal AI',
    ]),
  })
}

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitePages.models' })

  const heroFacts = [1, 2, 3].map((index) => ({
    title: t(`heroFacts.${index}.title`),
    body: t(`heroFacts.${index}.body`),
  }))

  const imageCards = ['gptImage', 'flux', 'qwen'].map((key) => ({
    eyebrow: t(`sections.images.cards.${key}.eyebrow`),
    title: t(`sections.images.cards.${key}.title`),
    body: t(`sections.images.cards.${key}.body`),
    bullets: [1, 2, 3].map((index) => t(`sections.images.cards.${key}.bullets.${index}`)),
  }))

  const videoCards = ['runway', 'kling', 'wan'].map((key) => ({
    eyebrow: t(`sections.video.cards.${key}.eyebrow`),
    title: t(`sections.video.cards.${key}.title`),
    body: t(`sections.video.cards.${key}.body`),
  }))

  const platformCards = ['llm', 'routing', 'ops', 'vision'].map((key) => ({
    eyebrow: t(`sections.platform.cards.${key}.eyebrow`),
    title: t(`sections.platform.cards.${key}.title`),
    body: t(`sections.platform.cards.${key}.body`),
  }))

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        body={t('heroBody')}
        links={[
          { label: t('primaryCta'), href: '/features' },
          { label: t('secondaryCta'), href: '/pricing', variant: 'secondary' },
        ]}
        facts={heroFacts}
      />

      <MarketingSection
        eyebrow={t('sections.images.eyebrow')}
        title={t('sections.images.title')}
        body={t('sections.images.body')}
      >
        <MarketingCardGrid>
          {imageCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.video.eyebrow')}
        title={t('sections.video.title')}
        body={t('sections.video.body')}
      >
        <MarketingCardGrid>
          {videoCards.map((card) => (
            <MarketingCard key={card.title} {...card} />
          ))}
        </MarketingCardGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t('sections.platform.eyebrow')}
        title={t('sections.platform.title')}
        body={t('sections.platform.body')}
      >
        <MarketingCardGrid columns={4}>
          {platformCards.map((card) => (
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

      <MarketingSiteTree activeHref="/models" />
    </MarketingShell>
  )
}
