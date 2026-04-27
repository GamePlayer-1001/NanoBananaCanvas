/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 react 的 useState，
 *          依赖 ./profile-tab, ./account-dashboard-tab, ./subscription-tab,
 *          ./works-tab, ./notifications-tab, ./model-preferences-tab, ./settings-tab，
 *          依赖 @/lib/billing、@/lib/storage 与 @/hooks/use-user 的类型
 * [OUTPUT]: 对外提供 AccountContent 账户页主内容组件
 * [POS]: profile 的页面式账户中心，被 /account 路由消费，默认展示个人资料
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, BookOpen, CreditCard, LayoutDashboard, Settings2, SlidersHorizontal, User } from 'lucide-react'

import type { CreditBalanceSummary, CreditTransactionsResult, CreditUsageResult } from '@/lib/billing/credits'
import type { PublicBillingPlanPrice, PublicCreditPackPrice } from '@/lib/billing/pricing'
import type { BillingSubscriptionSummary } from '@/lib/billing/subscription'
import type { StorageUsage } from '@/lib/storage'
import type { UserProfile } from '@/hooks/use-user'

import { AccountDashboardTab } from './account-dashboard-tab'
import { ModelPreferencesTab } from './model-preferences-tab'
import { NotificationsTab } from './notifications-tab'
import { ProfileTab } from './profile-tab'
import { SettingsTab } from './settings-tab'
import { SubscriptionTab } from './subscription-tab'
import { WorksTab } from './works-tab'

const TABS = [
  { id: 'profile', icon: User, labelKey: 'personalInfo' },
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { id: 'subscription', icon: CreditCard, labelKey: 'subscription' },
  { id: 'works', icon: BookOpen, labelKey: 'works' },
  { id: 'notifications', icon: Bell, labelKey: 'notifications' },
  { id: 'modelPreferences', icon: Settings2, labelKey: 'modelPreferences' },
  { id: 'settings', icon: SlidersHorizontal, labelKey: 'settings' },
] as const

type TabId = (typeof TABS)[number]['id']
type PurchaseMode = 'plan_auto_monthly' | 'plan_one_time' | 'credit_pack'

export interface AccountContentProps {
  currentUser: UserProfile
  subscription: BillingSubscriptionSummary
  balance: CreditBalanceSummary
  transactions: CreditTransactionsResult
  usage: CreditUsageResult
  storageUsage: StorageUsage
  isPricingReady: boolean
  plans: PublicBillingPlanPrice[]
  creditPacks: PublicCreditPackPrice[]
  initialTab?: string
}

const TAB_IDS = new Set<TabId>(TABS.map((tab) => tab.id))

function resolveInitialTab(tab?: string): TabId {
  if (tab && TAB_IDS.has(tab as TabId)) {
    return tab as TabId
  }

  return 'profile'
}

export function AccountContent({
  currentUser,
  subscription,
  balance,
  transactions,
  usage,
  storageUsage,
  isPricingReady,
  plans,
  creditPacks,
  initialTab,
}: AccountContentProps) {
  const t = useTranslations('profile')
  const [activeTab, setActiveTab] = useState<TabId>(() => resolveInitialTab(initialTab))
  const [subscriptionMode, setSubscriptionMode] = useState<PurchaseMode>('plan_auto_monthly')

  const handleOpenSubscription = (mode: PurchaseMode) => {
    setSubscriptionMode(mode)
    setActiveTab('subscription')
  }

  const tabContent = {
    profile: (
      <ProfileTab
        user={currentUser}
        onManageSubscription={() => handleOpenSubscription('plan_auto_monthly')}
      />
    ),
    dashboard: (
      <AccountDashboardTab
        subscription={subscription}
        balance={balance}
        transactions={transactions}
        usage={usage}
        onUpgrade={() => handleOpenSubscription('plan_auto_monthly')}
        onTopUp={() => handleOpenSubscription('credit_pack')}
      />
    ),
    subscription: (
      <SubscriptionTab
        isAuthenticated={currentUser.isAuthenticated}
        subscription={subscription}
        isPricingReady={isPricingReady}
        plans={plans}
        creditPacks={creditPacks}
        initialMode={subscriptionMode}
        onModeChange={setSubscriptionMode}
      />
    ),
    works: (
      <WorksTab
        isAuthenticated={currentUser.isAuthenticated}
        storageUsage={storageUsage}
        storageGB={balance.storageGB}
      />
    ),
    notifications: <NotificationsTab />,
    modelPreferences: <ModelPreferencesTab />,
    settings: <SettingsTab />,
  } satisfies Record<TabId, ReactNode>

  return (
    <div className="flex min-h-full items-start bg-background">
      <div className="sticky top-0 h-screen w-full max-w-[280px] overflow-y-auto border-r border-border bg-muted/20 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{t('account')}</h1>
          <p className="text-sm text-muted-foreground">{t('accountPageDesc')}</p>
        </div>

        <nav className="mt-6 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-50 font-medium text-brand-600'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <tab.icon size={16} />
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-w-0 flex-1 p-6 lg:p-8">
        {tabContent[activeTab]}
      </div>
    </div>
  )
}
