/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/components/locale-switcher，依赖 @/components/ui/select / switch / button，
 *          依赖 @/hooks/use-user-preferences 与 @/hooks/use-user
 * [OUTPUT]: 对外提供 SettingsTab 账户系统设置面板
 * [POS]: profile 的设置页签，被账户页消费，负责语言切换、时区矫正与新手提示控制
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Clock3, Globe, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useUpdateUserTimezone } from '@/hooks/use-user'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { TIMEZONE_OPTIONS } from '@/lib/timezones'

export function SettingsTab({ currentTimezone }: { currentTimezone: string | null }) {
  const t = useTranslations('profile')
  const updateTimezone = useUpdateUserTimezone()
  const {
    preferences,
    hasLoaded,
    setShowOnboardingTips,
    resetOnboardingProgress,
  } = useUserPreferences()
  const [selectedTimezone, setSelectedTimezone] = useState(() =>
    typeof window === 'undefined'
      ? 'UTC'
      : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  )
  const browserTimeZone =
    typeof window === 'undefined'
      ? 'UTC'
      : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const effectiveTimezone = currentTimezone ?? selectedTimezone ?? browserTimeZone

  const handleReset = () => {
    resetOnboardingProgress()
    toast.success(t('settingsResetSuccess'))
  }

  const handleTimezoneSave = async () => {
    try {
      await updateTimezone.mutateAsync(selectedTimezone)
      toast.success(t('timezoneSaveSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('timezoneSaveFailed'))
    }
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
          <Clock3 size={18} className="mt-0.5 text-brand-500" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">{t('timezoneSettingsTitle')}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('timezoneSettingsBody')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/10 px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t('timezoneCorrectTitle')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('timezoneCorrectBody', {
                timezone: effectiveTimezone,
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={effectiveTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="w-full min-w-[220px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {TIMEZONE_OPTIONS.map((timeZone) => (
                  <SelectItem key={timeZone} value={timeZone}>
                    {timeZone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleTimezoneSave()
              }}
              disabled={updateTimezone.isPending}
            >
              {updateTimezone.isPending ? t('timezoneSaving') : t('timezoneSaveAction')}
            </Button>
          </div>
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
