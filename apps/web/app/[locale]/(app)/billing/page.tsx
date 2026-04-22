/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 @/components/billing/billing-content，
 *          依赖 @/lib/api/auth、@/lib/billing/credits、@/lib/billing/subscription、@/lib/seo
 * [OUTPUT]: 对外提供 `/billing` 账单页
 * [POS]: (app) 路由组的本地账单工作台，承接余额、流水、usage 与 Stripe Portal 入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { BillingContent } from '@/components/billing/billing-content'
import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { getCreditBalanceSummary, getCreditTransactions, getCreditUsage } from '@/lib/billing/credits'
import { getBillingSubscription } from '@/lib/billing/subscription'
import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata: Metadata = NO_INDEX_METADATA
export const dynamic = 'force-dynamic'

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await getTranslations({ locale, namespace: 'billing' })

  const { userId } = await requireAuthenticatedAuth()
  const [subscription, balance, transactions, usage] = await Promise.all([
    getBillingSubscription(userId),
    getCreditBalanceSummary(userId),
    getCreditTransactions(userId, { page: 1, pageSize: 12 }),
    getCreditUsage(userId, { windowDays: 30 }),
  ])

  return (
    <BillingContent
      subscription={subscription}
      balance={balance}
      transactions={transactions}
      usage={usage}
    />
  )
}
