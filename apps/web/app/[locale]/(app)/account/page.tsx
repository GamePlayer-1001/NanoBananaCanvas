/**
 * [INPUT]: 依赖 next/headers 的 headers，依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/profile/account-content，依赖 @/lib/api/auth，
 *          依赖 @/lib/billing/credits / subscription / pricing
 * [OUTPUT]: 对外提供账户页面
 * [POS]: (app) 路由组的账户页，承载个人资料/仪表盘/订阅/作品/通知/API 接入配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'

import { AccountContent } from '@/components/profile/account-content'
import { requireAuth } from '@/lib/api/auth'
import { getCreditBalanceSummary, getCreditTransactions, getCreditUsage } from '@/lib/billing/credits'
import { getPublicPricingPlans } from '@/lib/billing/pricing'
import { FREE_PLAN_SNAPSHOT } from '@/lib/billing/plans'
import { getBillingSubscription } from '@/lib/billing/subscription'
import { NO_INDEX_METADATA } from '@/lib/seo'
import type { UserProfile } from '@/hooks/use-user'

export const metadata: Metadata = NO_INDEX_METADATA
export const dynamic = 'force-dynamic'

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const requestHeaders = await headers()
  const { userId: clerkUserId } = await auth()
  const isAuthenticated = Boolean(clerkUserId)
  const authUser = isAuthenticated ? await requireAuth() : null
  const currentUser: UserProfile = authUser
    ? {
        id: authUser.userId,
        actorId: authUser.actorId,
        actorKind: authUser.actorKind,
        isAuthenticated: authUser.isAuthenticated,
        identityKey: authUser.identityKey,
        clerkUserId: authUser.clerkUserId ?? null,
        username: authUser.username,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        name: authUser.name,
        email: authUser.email,
        avatarUrl: authUser.avatarUrl,
        tier: authUser.plan,
        plan: authUser.plan,
        membershipStatus: authUser.membershipStatus,
        createdAt: authUser.createdAt,
      }
    : {
        id: 'guest',
        actorId: 'guest',
        actorKind: 'anonymous',
        isAuthenticated: false,
        identityKey: 'guest',
        clerkUserId: null,
        username: '',
        firstName: '',
        lastName: '',
        name: 'Guest',
        email: '',
        avatarUrl: '',
        tier: FREE_PLAN_SNAPSHOT.plan,
        plan: FREE_PLAN_SNAPSHOT.plan,
        membershipStatus: FREE_PLAN_SNAPSHOT.plan,
        createdAt: '',
      }

  const [subscription, balance, transactions, usage, pricing] = await Promise.all([
    authUser
      ? getBillingSubscription(authUser.userId)
      : Promise.resolve({
          userId: 'guest',
          plan: FREE_PLAN_SNAPSHOT.plan,
          membershipStatus: FREE_PLAN_SNAPSHOT.plan,
          purchaseMode: 'free' as const,
          billingPeriod: 'monthly' as const,
          status: 'active',
          monthlyCredits: FREE_PLAN_SNAPSHOT.monthlyCredits,
          storageGB: FREE_PLAN_SNAPSHOT.storageGB,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          portalEligible: false,
          cancelEligible: false,
        }),
    authUser
      ? getCreditBalanceSummary(authUser.userId)
      : Promise.resolve({
          userId: 'guest',
          plan: FREE_PLAN_SNAPSHOT.plan,
          membershipStatus: FREE_PLAN_SNAPSHOT.plan,
          monthlyBalance: 0,
          permanentBalance: 0,
          frozenCredits: 0,
          availableCredits: 0,
          totalCredits: 0,
          totalEarned: 0,
          totalSpent: 0,
          currentPlanMonthlyCredits: FREE_PLAN_SNAPSHOT.monthlyCredits,
          storageGB: FREE_PLAN_SNAPSHOT.storageGB,
          updatedAt: null,
        }),
    authUser
      ? getCreditTransactions(authUser.userId, { page: 1, pageSize: 12 })
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 12,
          hasMore: false,
        }),
    authUser
      ? getCreditUsage(authUser.userId, { windowDays: 30 })
      : Promise.resolve({
          windowDays: 30,
          summary: {
            totalRequests: 0,
            successCount: 0,
            failedCount: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            estimatedCreditsSpent: 0,
          },
          byModel: [],
          daily: [],
        }),
    getPublicPricingPlans({
      countryCode: requestHeaders.get('cf-ipcountry'),
    }).catch((error: unknown) => {
      console.error('[account] Failed to load Stripe prices', error)
      return null
    }),
  ])

  return (
    <AccountContent
      currentUser={currentUser}
      subscription={subscription}
      balance={balance}
      transactions={transactions}
      usage={usage}
      isPricingReady={Boolean(pricing)}
      plans={pricing?.plans ?? []}
      creditPacks={pricing?.creditPacks ?? []}
    />
  )
}
