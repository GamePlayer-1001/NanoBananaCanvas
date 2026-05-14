/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 AuthorInfo 作者信息身份卡片
 * [POS]: explore/detail 的作者展示区，被 explore-detail-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 动态头像来自运行时远程地址，这里不走 Next Image 优化链。 */

import { useLocale, useTranslations } from 'next-intl'
import { Eye, Heart, Sparkles, Star } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────── */

interface AuthorInfoProps {
  name?: string | null
  avatar?: string
  membershipStatus?: string | null
  totalLikes?: number
  totalFavorites?: number
  totalViews?: number
}

/* ─── Component ──────────────────────────────────────── */

function formatMetric(value: number | undefined, locale: string) {
  return Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    Math.max(0, value ?? 0),
  )
}

function isVipMembership(status?: string | null) {
  return Boolean(status && status !== 'free')
}

export function AuthorInfo({
  name,
  avatar,
  membershipStatus,
  totalLikes,
  totalFavorites,
  totalViews,
}: AuthorInfoProps) {
  const t = useTranslations('exploreDetail')
  const locale = useLocale()
  const displayName = name?.trim() || t('unknownCreator')
  const vip = isVipMembership(membershipStatus)

  return (
    <div className="rounded-[28px] border border-stone-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
      <div className="flex items-stretch gap-4">
        <div className="h-[68px] w-[68px] flex-shrink-0 overflow-hidden rounded-[22px] bg-stone-100">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-lg font-semibold text-brand-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div className="flex min-h-[30px] items-center gap-2">
            <p className="truncate text-[18px] font-semibold leading-none text-stone-950">
              {displayName}
            </p>
            {vip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 shadow-[0_8px_18px_-14px_rgba(217,119,6,0.9)]">
                <Sparkles size={12} className="animate-pulse" />
                VIP
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">
              {t('author')}
            </span>
          </div>

          <div className="flex min-h-[30px] flex-wrap items-center gap-4 text-xs font-medium text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Heart size={13} />
              {formatMetric(totalLikes, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={13} />
              {formatMetric(totalFavorites, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} />
              {formatMetric(totalViews, locale)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
