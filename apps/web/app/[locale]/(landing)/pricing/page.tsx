/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/pricing/pricing-content
 * [OUTPUT]: 对外提供 PricingPage 定价页 (SSG)
 * [POS]: (landing) 路由组的定价页
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { PricingContent } from '@/components/pricing/pricing-content'

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
