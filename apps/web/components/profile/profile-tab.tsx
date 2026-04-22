/**
 * [INPUT]: 依赖 next-intl 的 useTranslations / useLocale，依赖 react 的 useState，
 *          依赖 @/hooks/use-user 的 useCurrentUser，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/auth/sign-out-action，依赖 sonner 的 toast，
 *          依赖 @/lib/auth/redirect 的 getDefaultSignOutRedirect
 * [OUTPUT]: 对外提供 ProfileTab 个人资料面板，含本地账单页与 Stripe Portal 入口
 * [POS]: profile 的个人资料 Tab，被账户页消费，承载基础身份信息与账单入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 匿名用户头像仍可能来自远程地址，直接渲染更稳妥。 */

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCurrentUser } from '@/hooks/use-user'
import { Link } from '@/i18n/navigation'
import { SignOutAction } from '@/components/auth/sign-out-action'
import { getDefaultSignOutRedirect } from '@/lib/auth/redirect'

/* ─── Component ──────────────────────────────────────── */

export function ProfileTab() {
  const t = useTranslations('profile')
  const locale = useLocale()
  const { data: user } = useCurrentUser()
  const signOutRedirect = getDefaultSignOutRedirect(locale)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  async function handleOpenPortal() {
    setIsOpeningPortal(true)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })
      const payload = (await response.json()) as {
        ok: boolean
        data?: { portalUrl: string }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.portalUrl) {
        throw new Error(payload.error?.message || t('manageBillingFailed'))
      }

      window.location.assign(payload.data.portalUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('manageBillingFailed'))
      setIsOpeningPortal(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('personalInfo')}</h3>

      {/* 头像 */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-lg font-medium text-brand-600">
              {user?.name?.charAt(0) ?? 'G'}
            </div>
          )}
        </div>
      </div>

      {/* 姓名 */}
      <div>
        <label className="text-sm font-medium text-foreground">{t('name')}</label>
        <input
          type="text"
          defaultValue={user?.name ?? 'Guest'}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-brand-500 focus:outline-none"
          readOnly
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t('username')}</label>
        <input
          type="text"
          defaultValue={user?.username ?? ''}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
          readOnly
        />
      </div>

      {/* 邮箱 */}
      <div>
        <label className="text-sm font-medium text-foreground">{t('email')}</label>
        <input
          type="text"
          defaultValue={user?.email ?? ''}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
          readOnly
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-foreground">{t('firstName')}</label>
          <input
            type="text"
            defaultValue={user?.firstName ?? ''}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
            readOnly
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">{t('lastName')}</label>
          <input
            type="text"
            defaultValue={user?.lastName ?? ''}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
            readOnly
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">{t('membershipStatus')}</label>
          <input
            type="text"
            defaultValue={user?.membershipStatus ?? user?.plan ?? 'free'}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
            readOnly
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        {user?.isAuthenticated ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t('signedInStatus')}</p>
              <p className="text-sm text-muted-foreground">{t('signedInStatusBody')}</p>
              <p className="text-sm text-muted-foreground">{t('manageBillingBody')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/billing"
                className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {t('openBillingWorkspace')}
              </Link>

              <button
                type="button"
                onClick={() => {
                  void handleOpenPortal()
                }}
                disabled={isOpeningPortal}
                className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOpeningPortal ? t('openingBilling') : t('manageBilling')}
              </button>

              <SignOutAction
                redirectUrl={signOutRedirect}
                className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('signOut')}
              </SignOutAction>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t('guestStatus')}</p>
              <p className="text-sm text-muted-foreground">{t('guestStatusBody')}</p>
            </div>

            <Link
              href="/sign-in?redirect_url=/account"
              className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              {t('goToSignIn')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
