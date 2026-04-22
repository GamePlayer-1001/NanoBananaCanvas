/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 next/headers 的 headers，
 *          依赖 @/components/pricing/pricing-content，依赖 @/lib/api/auth，依赖 @/lib/billing/config 与 @/lib/billing/pricing
 * [OUTPUT]: 对外提供 `/pricing` 公开定价页
 * [POS]: (landing) 路由组的商业化入口页，展示 Stripe 动态套餐价格、手动币种切换并承接匿名/登录态 CTA
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PricingContent } from '@/components/pricing/pricing-content'
import { optionalAuth } from '@/lib/api/auth'
import { normalizeBillingCurrency } from '@/lib/billing/config'
import { getPublicPricingPlans } from '@/lib/billing/pricing'
import { buildPageMetadata } from '@/lib/seo'

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
  })
}

export default async function PricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ currency?: string }>
}) {
  const { locale } = await params
  const { currency } = await searchParams
  setRequestLocale(locale)

  const requestHeaders = await headers()
  const [auth, pricing] = await Promise.all([
    optionalAuth(),
    getPublicPricingPlans({
      requestedCurrency: normalizeBillingCurrency(currency),
      countryCode: requestHeaders.get('cf-ipcountry'),
    }),
  ])

  return (
    <main>
      <PricingContent
        isAuthenticated={Boolean(auth?.isAuthenticated)}
        plans={pricing.plans}
        creditPacks={pricing.creditPacks}
        activeCurrency={pricing.currency}
      />
    </main>
  )
}
