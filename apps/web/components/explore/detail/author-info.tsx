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
  name: string
  avatar?: string
  publishedAt?: string
}

/* ─── Component ──────────────────────────────────────── */

export function AuthorInfo({ name, avatar, publishedAt }: AuthorInfoProps) {
  const t = useTranslations('exploreDetail')

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {/* 头像 */}
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {avatar ? (
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-medium text-brand-600">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* 信息 */}
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{t('author')}</p>
        </div>
      </div>

      {/* 发布时间 */}
      {publishedAt && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>{t('publishedOn', { date: publishedAt })}</span>
        </div>
      )}
    </div>
  )
}
