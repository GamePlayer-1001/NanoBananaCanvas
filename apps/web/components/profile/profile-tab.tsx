/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @clerk/nextjs 的 useUser
 * [OUTPUT]: 对外提供 ProfileTab 个人资料面板
 * [POS]: profile 的个人资料 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- Clerk 头像地址为运行时远程资源，直接渲染更稳妥。 */

import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'

/* ─── Component ──────────────────────────────────────── */

export function ProfileTab() {
  const t = useTranslations('profile')
  const { user } = useUser()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('personalInfo')}</h3>

      {/* 头像 */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-lg font-medium text-brand-600">
              {user?.firstName?.charAt(0) ?? '?'}
            </div>
          )}
        </div>
      </div>

      {/* 姓名 */}
      <div>
        <label className="text-sm font-medium text-foreground">{t('name')}</label>
        <input
          type="text"
          defaultValue={user?.fullName ?? ''}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-brand-500 focus:outline-none"
          readOnly
        />
      </div>

      {/* 邮箱 */}
      <div>
        <label className="text-sm font-medium text-foreground">{t('email')}</label>
        <input
          type="text"
          defaultValue={user?.primaryEmailAddress?.emailAddress ?? ''}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
          readOnly
        />
      </div>

      {/* 密码 */}
      <div>
        <label className="text-sm font-medium text-foreground">{t('password')}</label>
        <div className="mt-1.5">
          <button className="text-sm text-brand-600 transition-colors hover:text-brand-700">
            {t('changePassword')}
          </button>
        </div>
      </div>

      {/* 删除账户 */}
      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium text-destructive">{t('deleteAccount')}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{t('deleteAccountDesc')}</p>
        <button className="mt-3 rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
          {t('deleteButton')}
        </button>
      </div>
    </div>
  )
}
