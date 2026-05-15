/**
 * [INPUT]: 依赖 next/headers 的 headers，依赖 next-intl/server 的 getTranslations/setRequestLocale，
 *          依赖 @/components/landing/hero-section，
 *          依赖 @/components/landing/model-mind-map-section，
 *          依赖 @/components/landing/landing-sections，
 *          依赖 @/components/layout/landing-footer，依赖 @/lib/billing/pricing 与 @/lib/billing/subscription
 * [OUTPUT]: 对外提供 Landing Page 首页
 * [POS]: (landing) 路由组的首页，默认静态输出 Hero/功能/人格分层定价/评价/模型云图/FAQ/Footer；公开子页已收口，仅保留条款与隐私页
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { HeroSection } from '@/components/landing/hero-section'
import {
  FaqSection,
  FeaturesSection,
  ModelMindMapSection,
  PricingSection,
  TestimonialsSection,
} from '@/components/landing/landing-sections'
import { LandingFooter } from '@/components/layout/landing-footer'
import { getPublicPricingPlans } from '@/lib/billing/pricing'
import { getBillingSubscription } from '@/lib/billing/subscription'
import { AVAILABLE_LANGUAGE_CODES } from '@/i18n/config'
import {
  BASE_URL,
  SITE_NAME,
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
    title: t('landingTitle'),
    description: t('landingDescription'),
    path: '/',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'AI workflow builder',
      'image generation workflow',
      'visual AI canvas',
      'multimodal production',
    ]),
  })
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const requestHeaders = await headers()
  const { userId } = await auth()
  setRequestLocale(locale)
  const seoT = await getTranslations({ locale, namespace: 'landingSeo' })
  const faqT = await getTranslations({ locale, namespace: 'landing.sections.faq' })
  const pricing = await getPublicPricingPlans({
    countryCode: requestHeaders.get('cf-ipcountry'),
  }).catch((error: unknown) => {
    console.error('[landing] Failed to load Stripe prices', error)
    return null
  })
  const subscription = userId
    ? await getBillingSubscription(userId).catch((error: unknown) => {
        console.error('[landing] Failed to load billing subscription', error)
        return null
      })
    : null

  const faqItems = [
    'what',
    'models',
    'canvas',
    'gptImage',
    'pricing',
    'api',
    'team',
    'commercial',
    'privacy',
    'contact',
  ].map((key) => ({
    question: faqT(`${key}.question`),
    answer: faqT(`${key}.answer`),
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
          url: BASE_URL,
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
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <FeaturesSection />
      <PricingSection
        plans={pricing?.plans ?? []}
        isAuthenticated={Boolean(userId)}
        subscription={subscription}
      />
      <TestimonialsSection />
      <ModelMindMapSection />
      <FaqSection />
      <LandingFooter />
    </main>
  )
}
