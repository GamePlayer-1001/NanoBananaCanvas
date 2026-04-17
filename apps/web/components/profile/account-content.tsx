/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 react 的 useState，
 *          依赖 ./profile-tab, ./works-tab, ./notifications-tab, ./model-preferences-tab
 * [OUTPUT]: 对外提供 AccountContent 账户页主内容组件
 * [POS]: profile 的页面式账户中心，被 /account 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, BookOpen, Settings2, User } from 'lucide-react'

import { ModelPreferencesTab } from './model-preferences-tab'
import { NotificationsTab } from './notifications-tab'
import { ProfileTab } from './profile-tab'
import { WorksTab } from './works-tab'

const TABS = [
  { id: 'profile', icon: User, labelKey: 'personalInfo' },
  { id: 'works', icon: BookOpen, labelKey: 'works' },
  { id: 'notifications', icon: Bell, labelKey: 'notifications' },
  { id: 'modelPreferences', icon: Settings2, labelKey: 'modelPreferences' },
] as const

type TabId = (typeof TABS)[number]['id']

const TAB_CONTENT: Record<TabId, React.FC> = {
  profile: ProfileTab,
  works: WorksTab,
  notifications: NotificationsTab,
  modelPreferences: ModelPreferencesTab,
}

export function AccountContent() {
  const t = useTranslations('profile')
  const [activeTab, setActiveTab] = useState<TabId>('modelPreferences')
  const ActiveContent = TAB_CONTENT[activeTab]

  return (
    <div className="flex min-h-full bg-background">
      <div className="w-full max-w-[260px] border-r border-border bg-muted/20 p-4">
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
        <ActiveContent />
      </div>
    </div>
  )
}
