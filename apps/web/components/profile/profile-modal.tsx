/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/profile 的各 Tab 组件，
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 ProfileModal 个人中心弹窗
 * [POS]: profile 的入口容器，由 sidebar footer avatar 触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, User, CreditCard, Crown, Settings2 } from 'lucide-react'

import { ProfileTab } from './profile-tab'
import { BillingTab } from './billing-tab'
import { SubscriptionTab } from './subscription-tab'
import { ModelPreferencesTab } from './model-preferences-tab'

/* ─── Tab Config ─────────────────────────────────────── */

const TABS = [
  { id: 'profile', icon: User, labelKey: 'personalInfo' },
  { id: 'billing', icon: CreditCard, labelKey: 'billing' },
  { id: 'subscription', icon: Crown, labelKey: 'subscription' },
  { id: 'modelPreferences', icon: Settings2, labelKey: 'modelPreferences' },
] as const

type TabId = (typeof TABS)[number]['id']

/* ─── Tab Content Map ────────────────────────────────── */

const TAB_CONTENT: Record<TabId, React.FC> = {
  profile: ProfileTab,
  billing: BillingTab,
  subscription: SubscriptionTab,
  modelPreferences: ModelPreferencesTab,
}

/* ─── Component ──────────────────────────────────────── */

export function ProfileModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('profile')
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  if (!open) return null

  const ActiveContent = TAB_CONTENT[activeTab]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[520px] w-full max-w-[720px] overflow-hidden rounded-xl bg-background shadow-2xl">
        {/* 左侧 Tab 导航 */}
        <div className="flex w-[200px] flex-col border-r border-border bg-muted/30 py-4">
          <h2 className="mb-4 px-4 text-lg font-semibold text-foreground">
            {t('account')}
          </h2>
          <nav className="space-y-0.5 px-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
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

        {/* 右侧内容 */}
        <div className="relative flex-1 overflow-y-auto p-6">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={18} />
          </button>

          <ActiveContent />
        </div>
      </div>
    </div>
  )
}
