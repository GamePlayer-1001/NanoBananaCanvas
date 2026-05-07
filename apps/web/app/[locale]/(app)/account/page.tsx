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
import { getCreditBalanceSummary } from '@/lib/billing/credits'
import { getPublicPricingPlans } from '@/lib/billing/pricing'
import { FREE_PLAN_SNAPSHOT } from '@/lib/billing/plans'
import { getBillingSubscription } from '@/lib/billing/subscription'
import { NO_INDEX_METADATA } from '@/lib/seo'
import type { UserProfile } from '@/hooks/use-user'

export const metadata: Metadata = NO_INDEX_METADATA
export const dynamic = 'force-dynamic'

function createGuestSubscription() {
  return {
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
  }
}

function createGuestBalance() {
  return {
    userId: 'guest',
    plan: FREE_PLAN_SNAPSHOT.plan,
    membershipStatus: FREE_PLAN_SNAPSHOT.plan,
    trialBalance: 0,
    trialExpiresAt: null,
    monthlyBalance: 0,
    permanentBalance: 0,
    frozenCredits: 0,
    availableCredits: 0,
    totalCredits: 0,
    totalEarned: 0,
    totalSpent: 0,
    checkedInToday: false,
    currentPlanMonthlyCredits: FREE_PLAN_SNAPSHOT.monthlyCredits,
    storageGB: FREE_PLAN_SNAPSHOT.storageGB,
    updatedAt: null,
  }
}

async function loadOptionalAccountData<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await loader()
  } catch (error: unknown) {
    console.error(`[account] Failed to load ${label}`, error)
    return fallback
  }
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ tab?: string | string[] }>
}) {
  const { locale } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
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
        hasPassword: authUser.hasPassword,
        tier: authUser.plan,
        plan: authUser.plan,
        membershipStatus: authUser.membershipStatus,
        timezone: authUser.timezone,
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
        hasPassword: false,
        tier: FREE_PLAN_SNAPSHOT.plan,
        plan: FREE_PLAN_SNAPSHOT.plan,
        membershipStatus: FREE_PLAN_SNAPSHOT.plan,
        timezone: null,
        createdAt: '',
      }

  const guestSubscription = createGuestSubscription()
  const guestBalance = createGuestBalance()
  const [subscription, balance, pricing] = await Promise.all([
    authUser
      ? loadOptionalAccountData('billing subscription', () => getBillingSubscription(authUser.userId), guestSubscription)
      : Promise.resolve(guestSubscription),
    authUser
      ? loadOptionalAccountData('credit balance', () => getCreditBalanceSummary(authUser.userId), guestBalance)
      : Promise.resolve(guestBalance),
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
      isPricingReady={Boolean(pricing)}
      plans={pricing?.plans ?? []}
      creditPacks={pricing?.creditPacks ?? []}
      initialTab={
        Array.isArray(resolvedSearchParams?.tab)
          ? resolvedSearchParams.tab[0]
          : resolvedSearchParams?.tab
      }
    />
  )
}
