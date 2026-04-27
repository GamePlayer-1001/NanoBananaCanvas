/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/components/locale-switcher，依赖 @/components/ui/switch / button，
 *          依赖 @/hooks/use-user-preferences
 * [OUTPUT]: 对外提供 SettingsTab 账户系统设置面板
 * [POS]: profile 的设置页签，被账户页消费，负责语言切换与新手提示控制
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Globe, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useUserPreferences } from '@/hooks/use-user-preferences'

export function SettingsTab() {
  const t = useTranslations('profile')
  const {
    preferences,
    hasLoaded,
    setShowOnboardingTips,
    resetOnboardingProgress,
  } = useUserPreferences()

  const handleReset = () => {
    resetOnboardingProgress()
    toast.success(t('settingsResetSuccess'))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{t('settings')}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('settingsDesc')}
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <Globe size={18} className="mt-0.5 text-brand-500" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">{t('languageSettingsTitle')}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('languageSettingsBody')}
            </p>
          </div>
          <LocaleSwitcher />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 text-brand-500" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">{t('onboardingSettingsTitle')}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('onboardingSettingsBody')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/10 px-3 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t('showOnboardingTipsTitle')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('showOnboardingTipsBody')}
            </p>
          </div>
          <Switch
            checked={preferences.showOnboardingTips}
            disabled={!hasLoaded}
            onCheckedChange={setShowOnboardingTips}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-border/70 px-3 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t('resetOnboardingTitle')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('resetOnboardingBody')}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw size={14} />
            {t('resetOnboardingAction')}
          </Button>
        </div>
      </section>
    </div>
  )
}
