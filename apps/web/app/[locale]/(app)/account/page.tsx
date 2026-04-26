/**
 * [INPUT]: 依赖 next/headers 的 headers，依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/profile/account-content，依赖 @/lib/api/auth，
 *          依赖 @/lib/billing/credits / subscription / pricing，依赖 @/lib/storage
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
import { getStorageUsage } from '@/lib/storage'
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
  }
}

function createGuestTransactions() {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 0,
    hasMore: false,
  }
}

function createGuestUsage() {
  return {
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
  }
}

function createGuestStorageUsage() {
  return {
    usedBytes: 0,
    limitBytes: FREE_PLAN_SNAPSHOT.storageGB * 1024 * 1024 * 1024,
    usedPercent: 0,
    isOverQuota: false,
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
        createdAt: '',
      }

  const guestSubscription = createGuestSubscription()
  const guestBalance = createGuestBalance()
  const guestTransactions = createGuestTransactions()
  const guestUsage = createGuestUsage()
  const guestStorageUsage = createGuestStorageUsage()

  const [subscription, balance, transactions, usage, pricing, storageUsage] = await Promise.all([
    authUser
      ? loadOptionalAccountData('billing subscription', () => getBillingSubscription(authUser.userId), guestSubscription)
      : Promise.resolve(guestSubscription),
    authUser
      ? loadOptionalAccountData('credit balance', () => getCreditBalanceSummary(authUser.userId), guestBalance)
      : Promise.resolve(guestBalance),
    authUser
      ? loadOptionalAccountData(
          'credit transactions',
          () => getCreditTransactions(authUser.userId, { fetchAll: true }),
          guestTransactions,
        )
      : Promise.resolve(guestTransactions),
    authUser
      ? loadOptionalAccountData('credit usage', () => getCreditUsage(authUser.userId, { windowDays: 30 }), guestUsage)
      : Promise.resolve(guestUsage),
    getPublicPricingPlans({
      countryCode: requestHeaders.get('cf-ipcountry'),
    }).catch((error: unknown) => {
      console.error('[account] Failed to load Stripe prices', error)
      return null
    }),
    authUser
      ? loadOptionalAccountData('storage usage', () => getStorageUsage(authUser.userId), guestStorageUsage)
      : Promise.resolve(guestStorageUsage),
  ])

  return (
    <AccountContent
      currentUser={currentUser}
      subscription={subscription}
      balance={balance}
      transactions={transactions}
      usage={usage}
      storageUsage={storageUsage}
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
