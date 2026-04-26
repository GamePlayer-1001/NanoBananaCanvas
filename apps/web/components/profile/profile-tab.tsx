/**
 * [INPUT]: 依赖 next-intl 的 useTranslations / useLocale，依赖 react 的 useState，
 *          依赖 @clerk/nextjs 的 useClerk，依赖 @/hooks/use-user 的 UserProfile 类型，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/auth/sign-out-action，
 *          依赖 sonner 的 toast，依赖 @/lib/auth/redirect 的 getDefaultSignOutRedirect
 * [OUTPUT]: 对外提供 ProfileTab 个人资料面板，含账户基础信息与 Clerk 安全中心入口
 * [POS]: profile 的个人资料 Tab，被账户页消费，承载基础身份信息、退出登录与安全操作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 匿名用户头像仍可能来自远程地址，直接渲染更稳妥。 */

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AlertTriangle, ChevronRight, KeyRound, ShieldAlert } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { SignOutAction } from '@/components/auth/sign-out-action'
import { getDefaultSignOutRedirect } from '@/lib/auth/redirect'
import type { UserProfile } from '@/hooks/use-user'

/* ─── Component ──────────────────────────────────────── */

interface ProfileTabProps {
  user: UserProfile
  onManageSubscription: () => void
}

export function ProfileTab({ user, onManageSubscription }: ProfileTabProps) {
  const t = useTranslations('profile')
  const locale = useLocale()
  const clerk = useClerk() as ReturnType<typeof useClerk> & {
    openUserProfile?: (props?: Record<string, unknown>) => void
    redirectToUserProfile?: () => Promise<unknown>
  }
  const signOutRedirect = getDefaultSignOutRedirect(locale)
  const [isOpeningSecurity, setIsOpeningSecurity] = useState(false)

  async function handleOpenSecurityCenter() {
    if (!user.isAuthenticated) {
      return
    }

    setIsOpeningSecurity(true)
    try {
      if (typeof clerk.openUserProfile === 'function') {
        clerk.openUserProfile({
          initialPage: 'security',
        })
        return
      }

      if (typeof clerk.redirectToUserProfile === 'function') {
        await clerk.redirectToUserProfile()
        return
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('securityCenterFailed'))
    } finally {
      setIsOpeningSecurity(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-100 text-2xl font-medium text-brand-600">
                  {user.name?.charAt(0) ?? 'G'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                {t('personalInfo')}
              </p>
              <h3 className="text-2xl font-semibold text-foreground">{user.name ?? 'Guest'}</h3>
              <p className="text-sm text-muted-foreground">
                {user.isAuthenticated ? t('profileSignedInDesc') : t('guestStatusBody')}
              </p>
            </div>
          </div>

          {user.isAuthenticated ? (
            <button
              type="button"
              onClick={onManageSubscription}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {t('profileOpenSubscription')}
              <ChevronRight size={16} />
            </button>
          ) : (
            <Link
              href="/sign-in?redirect_url=/account"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              {t('goToSignIn')}
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ProfileField label={t('profileAvatar')} value={user.avatarUrl ? t('profileAvatarConnected') : t('profileAvatarPlaceholder')} />
          <ProfileField label={t('profileNickname')} value={user.name ?? 'Guest'} />
          <ProfileField label={t('email')} value={user.email || t('profileEmptyValue')} />
          <ProfileField
            label={t('profilePassword')}
            value={user.isAuthenticated ? '••••••••' : t('profileEmptyValue')}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
        {user.isAuthenticated ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="mt-0.5 text-brand-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t('profileSecurityTitle')}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t('profileSecurityBody')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleOpenSecurityCenter()
                }}
                disabled={isOpeningSecurity}
                className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOpeningSecurity ? t('profileOpeningSecurity') : t('profileChangePassword')}
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleOpenSecurityCenter()
                }}
                disabled={isOpeningSecurity}
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/35 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldAlert size={16} />
                {t('profileDeleteAccount')}
              </button>

              <SignOutAction
                redirectUrl={signOutRedirect}
                className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('signOut')}
              </SignOutAction>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-950">
                    {t('profileSecurityHintTitle')}
                  </p>
                  <p className="text-sm leading-6 text-amber-800">
                    {t('profileSecurityHintBody')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t('guestStatus')}</p>
              <p className="text-sm text-muted-foreground">{t('guestStatusBody')}</p>
            </div>

            <Link
              href="/sign-in?redirect_url=/account"
              className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              {t('goToSignIn')}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-base font-medium text-foreground">{value}</p>
    </div>
  )
}
