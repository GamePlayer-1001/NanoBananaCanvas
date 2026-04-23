/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/landing/hero-section，依赖 @/components/landing/landing-sections，
 *          依赖 @/components/landing/landing-faq 的 LANDING_FAQ_ITEMS，
 *          依赖 @/components/layout/landing-footer
 * [OUTPUT]: 对外提供 Landing Page 首页
 * [POS]: (landing) 路由组的首页，SSG 渲染，承载 Hero、模型区、功能区、FAQ 与 CTA
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LANDING_FAQ_ITEMS } from '@/components/landing/landing-faq'
import { HeroSection } from '@/components/landing/hero-section'
import { LandingSections } from '@/components/landing/landing-sections'
import { LandingFooter } from '@/components/layout/landing-footer'
import { AVAILABLE_LANGUAGE_CODES } from '@/i18n/config'
import {
  BASE_URL,
  SITE_NAME,
  buildAbsoluteUrl,
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
    title: t('landingTitle'),
    description: t('landingDescription'),
    path: '/',
    locale,
  })
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const seoT = await getTranslations({ locale, namespace: 'landingSeo' })

  const faqItems = LANDING_FAQ_ITEMS.map((item) => ({
    question: seoT(item.questionKey),
    answer: seoT(item.answerKey),
  }))

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: buildAbsoluteUrl('/contact'),
          availableLanguage: AVAILABLE_LANGUAGE_CODES,
        },
      ],
      areaServed: [
        seoT('coverageRegionAmericas'),
        seoT('coverageRegionEurope'),
        seoT('coverageRegionApac'),
      ],
      sameAs: [
        'https://t.me/nanobananacanvas',
        'https://discord.gg/nanobananacanvas',
        'https://x.com/nanobananacanvas',
        'https://instagram.com/nanobananacanvas',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      url: BASE_URL,
      description: seoT('structuredDescription'),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      availableLanguage: AVAILABLE_LANGUAGE_CODES,
      featureList: [
        seoT('featureWorkflow'),
        seoT('featureImageVideo'),
        seoT('featureTemplates'),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  return (
    <main className="landing-snap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <LandingSections />
      <LandingFooter />
    </main>
  )
}
