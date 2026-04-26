/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 VideoCard 可复用视频卡片组件 (含节点类型 Badge + 作品类型徽标)
 * [POS]: shared 的通用视频卡，被 explore/workspace 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 缩略图与头像都来自用户内容或运行时远程 URL，不适合额外域名约束。 */

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

/* ─── Types ──────────────────────────────────────────── */

export interface VideoCardData {
  id: string
  title: string
  thumbnailUrl?: string
  duration?: string
  contentType?: 'video' | 'image' | 'workflow'
  author: {
    name: string
    avatarUrl?: string
  }
  views?: number
  createdAt?: string
  nodeTypes?: string[]
}

/* ─── Helpers ────────────────────────────────────────── */

function formatViews(n?: number): string {
  if (!n) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

/* ─── Component ──────────────────────────────────────── */

export function VideoCard({ data }: { data: VideoCardData }) {
  const t = useTranslations('explore')

  return (
    <Link href={`/explore/${data.id}`} className="group block">
      {/* 缩略图 */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {data.thumbnailUrl ? (
          <img
            src={data.thumbnailUrl}
            alt={data.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <span className="text-xs text-muted-foreground">No Preview</span>
          </div>
        )}

        {/* 时长标签 */}
        {data.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {data.duration}
          </span>
        )}

        {data.contentType && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/95 backdrop-blur-sm">
            {t(`type_${data.contentType}`)}
          </span>
        )}

        {/* 节点类型标签 */}
        {data.nodeTypes && data.nodeTypes.length > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1">
            {data.nodeTypes.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 信息区 */}
      <div className="mt-2 flex gap-2">
        {/* 头像 */}
        <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {data.author.avatarUrl ? (
            <img
              src={data.author.avatarUrl}
              alt={data.author.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-[10px] font-medium text-brand-600">
              {data.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* 文字 */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground group-hover:text-brand-600">
            {data.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {data.author.name}
          </p>
          {(data.views !== undefined || data.createdAt) && (
            <p className="text-xs text-muted-foreground/70">
              {data.views !== undefined && `${formatViews(data.views)} views`}
              {data.views !== undefined && data.createdAt && ' • '}
              {data.createdAt}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
