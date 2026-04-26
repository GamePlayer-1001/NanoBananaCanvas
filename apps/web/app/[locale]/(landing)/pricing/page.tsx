/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 auth，依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 next/headers 的 headers，
 *          依赖 @/components/pricing/pricing-content，依赖 @/components/landing/marketing-site-tree，
 *          依赖 @/lib/billing/pricing
 * [OUTPUT]: 对外提供 `/pricing` 公开定价页
 * [POS]: (landing) 路由组的商业化入口页，展示 Stripe 动态套餐价格并在计费配置异常时保留 Free 入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import { PricingContent } from '@/components/pricing/pricing-content'
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
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const requestHeaders = await headers()
  const { userId } = await auth()
  const pricing = await getPublicPricingPlans({
    countryCode: requestHeaders.get('cf-ipcountry'),
  }).catch((error: unknown) => {
    console.error('[pricing] Failed to load Stripe prices', error)
    return null
  })

  return (
    <main>
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
