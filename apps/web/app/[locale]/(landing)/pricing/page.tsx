/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/pricing/pricing-content
 * [OUTPUT]: 对外提供 PricingPage 定价页 (SSG)
 * [POS]: (landing) 路由组的定价页
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PricingContent } from '@/components/pricing/pricing-content'

const BASE_URL = 'https://nanobananacanvas.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('pricingTitle'),
    description: t('pricingDescription'),
    alternates: {
      canonical: `${BASE_URL}/${locale}/pricing`,
      languages: { en: `${BASE_URL}/en/pricing`, zh: `${BASE_URL}/zh/pricing` },
    },
    openGraph: {
      title: `${t('pricingTitle')} | Nano Banana Canvas`,
      description: t('pricingDescription'),
      url: `${BASE_URL}/${locale}/pricing`,
      siteName: 'Nano Banana Canvas',
      type: 'website',
    },
  }
}

/* ─── Page ───────────────────────────────────────────── */

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <PricingContent />
}
