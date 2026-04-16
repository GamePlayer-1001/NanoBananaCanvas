/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-user 的 useCurrentUser
 * [OUTPUT]: 对外提供 ProfileTab 个人资料面板
 * [POS]: profile 的个人资料 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 匿名用户头像仍可能来自远程地址，直接渲染更稳妥。 */

import { useTranslations } from 'next-intl'
import { useCurrentUser } from '@/hooks/use-user'

/* ─── Component ──────────────────────────────────────── */

export function ProfileTab() {
  const t = useTranslations('profile')
  const { data: user } = useCurrentUser()

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
    </div>
  )
}
