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
  mediaUrl?: string
  duration?: string
  contentType?: 'video' | 'image' | 'workflow'
  entityType?: 'workflow' | 'output'
  author: {
    name: string
    avatarUrl?: string
  }
  views?: number
  createdAt?: string
  nodeTypes?: string[]
}

/* ─── Helpers ────────────────────────────────────────── */

function getDisplayName(name?: string): string {
  return name?.trim() || 'Unknown Creator'
}

function getInitial(name?: string): string {
  return getDisplayName(name).charAt(0).toUpperCase()
}

function formatViews(n?: number): string {
  if (!n) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatCreatedAt(value?: string): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/* ─── Component ──────────────────────────────────────── */

export function VideoCard({ data }: { data: VideoCardData }) {
  const t = useTranslations('explore')
  const authorName = getDisplayName(data.author.name)
  const meta = [data.views !== undefined ? `${formatViews(data.views)} views` : '', formatCreatedAt(data.createdAt)]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/explore/${data.id}`} className="group block">
      {/* 缩略图 */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_44px_-24px_rgba(99,102,241,0.35)]">
        {data.contentType === 'video' && data.mediaUrl ? (
          <video
            src={data.mediaUrl}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            muted
            playsInline
            preload="metadata"
          />
        ) : data.thumbnailUrl ? (
          <img
            src={data.thumbnailUrl}
            alt={data.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_45%),linear-gradient(135deg,rgba(248,250,252,0.9),rgba(226,232,240,0.75))]">
            <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground/80 uppercase">
              No Preview
            </span>
          </div>
        )}

        {/* 时长标签 */}
        {data.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {data.duration}
          </span>
        )}

        {data.contentType && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white/95 backdrop-blur-sm">
            {t(`type_${data.contentType}`)}
          </span>
        )}

        {/* 节点类型标签 */}
        {data.entityType === 'workflow' && data.nodeTypes && data.nodeTypes.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {data.nodeTypes.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 信息区 */}
      <div className="mt-4 flex gap-3 px-1">
        {/* 头像 */}
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
          {data.author.avatarUrl ? (
            <img
              src={data.author.avatarUrl}
              alt={authorName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-medium text-brand-600">
              {getInitial(authorName)}
            </div>
          )}
        </div>

        {/* 文字 */}
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-6 text-foreground transition-colors group-hover:text-brand-600">
            {data.title}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {authorName}
          </p>
          {meta ? <p className="text-xs text-muted-foreground/75">{meta}</p> : null}
        </div>
      </div>
    </Link>
  )
}
