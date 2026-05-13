/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 AuthorInfo 作者信息卡片
 * [POS]: explore/detail 的作者展示区，被 explore-detail-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 动态头像来自运行时远程地址，这里不走 Next Image 优化链。 */

import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────── */

interface AuthorInfoProps {
  name?: string | null
  avatar?: string
  publishedAt?: string
}

/* ─── Component ──────────────────────────────────────── */

export function AuthorInfo({ name, avatar, publishedAt }: AuthorInfoProps) {
  const t = useTranslations('exploreDetail')
  const displayName = name?.trim() || 'Unknown Creator'

  return (
    <div className="rounded-[28px] border border-stone-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-stone-100">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-medium text-brand-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-stone-900">{displayName}</p>
          <p className="text-sm text-stone-500">{t('author')}</p>
        </div>
      </div>

      {publishedAt && (
        <div className="mt-4 flex items-center gap-1.5 text-sm text-stone-500">
          <Calendar size={12} />
          <span>{t('publishedOn', { date: publishedAt })}</span>
        </div>
      )}
    </div>
  )
}
