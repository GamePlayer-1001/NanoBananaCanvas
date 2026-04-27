/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 auth，依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 next/headers 的 headers，
 *          依赖 @/components/pricing/pricing-content，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/billing/pricing，依赖 @/lib/seo 的 metadata/URL/关键词工具
 * [OUTPUT]: 对外提供 `/pricing` 公开定价页 + SEO metadata + Product/Offer/BreadcrumbList 结构化数据
 * [POS]: (landing) 路由组的商业化入口页，展示 Stripe 动态套餐价格并承接 GPT Image 工作流定价搜索意图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import { PricingContent } from '@/components/pricing/pricing-content'
import { getPublicPricingPlans } from '@/lib/billing/pricing'
import { FREE_PLAN_SNAPSHOT } from '@/lib/billing/plans'
import {
  BASE_URL,
  GPT_IMAGE_PRIORITY_KEYWORDS,
  SITE_NAME,
  buildAbsoluteUrl,
  buildPageMetadata,
  mergeKeywords,
} from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pricing' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/pricing',
    locale,
    keywords: mergeKeywords(GPT_IMAGE_PRIORITY_KEYWORDS, [
      'AI workflow pricing',
      'image generation pricing',
      'multimodal workflow pricing',
      'AI credit packs',
    ]),
  })
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const requestHeaders = await headers()
  const { userId } = await auth()
  const t = await getTranslations({ locale, namespace: 'pricing' })
  const pricing = await getPublicPricingPlans({
    countryCode: requestHeaders.get('cf-ipcountry'),
  }).catch((error: unknown) => {
    console.error('[pricing] Failed to load Stripe prices', error)
    return null
  })

  const pricingKeywords = mergeKeywords(GPT_IMAGE_PRIORITY_KEYWORDS, [
    'AI workflow pricing',
    'image generation pricing',
    'multimodal workflow pricing',
    'AI credit packs',
  ])
  const pricingUrl = buildAbsoluteUrl('/pricing')
  const freeOffer = {
    '@type': 'Offer',
    url: pricingUrl,
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    category: 'Free plan',
    description: t('freeDescription'),
  }
  const paidPlanOffers =
    pricing?.plans.map((plan) => ({
      '@type': 'Offer',
      url: pricingUrl,
      sku: plan.stripePriceId,
      name: `${t(`${plan.plan}Name`)} ${plan.purchaseMode === 'plan_auto_monthly' ? t('toggleMonthly') : t('toggleOneTime')}`,
      description: `${t(`${plan.plan}Description`)} ${pricingKeywords[0]} and ${pricingKeywords[1]} support.`,
      price: (plan.unitAmount / 100).toFixed(2),
      priceCurrency: plan.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      category:
        plan.purchaseMode === 'plan_auto_monthly' ? 'Subscription plan' : 'One-time plan',
    })) ?? []
  const creditPackOffers =
    pricing?.creditPacks.map((creditPack) => ({
      '@type': 'Offer',
      url: pricingUrl,
      sku: creditPack.stripePriceId,
      name: `${creditPack.totalCredits.toLocaleString(locale)} ${t('toggleCredits')}`,
      description: `${pricingKeywords[0]} capacity pack for ${pricingKeywords[1]} and creator workflow production.`,
      price: (creditPack.unitAmount / 100).toFixed(2),
      priceCurrency: creditPack.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      category: 'Credit pack',
    })) ?? []
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${SITE_NAME} GPT Image Workflow Pricing`,
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
      category: 'AI workflow platform',
      description: t('metaDescription'),
      url: pricingUrl,
      image: `${BASE_URL}/brand/logo-1024.png`,
      keywords: pricingKeywords.join(', '),
      offers: [freeOffer, ...paidPlanOffers, ...creditPackOffers],
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Free storage',
          value: `${FREE_PLAN_SNAPSHOT.storageGB} GB`,
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
          name: t('metaTitle'),
          item: pricingUrl,
        },
      ],
    },
  ]

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingContent
        isAuthenticated={Boolean(userId)}
        isPricingReady={Boolean(pricing)}
        plans={pricing?.plans ?? []}
        creditPacks={pricing?.creditPacks ?? []}
      />
      <div className="bg-[#09090d] px-4 pb-24 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1380px]">
          <MarketingSiteTree activeHref="/pricing" />
        </div>
      </div>
    </main>
  )
}
