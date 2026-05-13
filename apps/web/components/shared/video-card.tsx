/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 VideoCard 可复用内容卡片组件 (支持默认信息卡与 Explore 瀑布流悬浮卡)
 * [POS]: shared 的通用内容卡，被 explore/workspace 页面消费；Explore 以强视觉模式复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 缩略图与头像都来自用户内容或运行时远程 URL，不适合额外域名约束。 */

import { useTranslations } from 'next-intl'
import { Bookmark, Ellipsis, Heart, Play, Sparkles } from 'lucide-react'

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
  description?: string
  categoryName?: string
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

function formatDuration(duration?: string) {
  if (duration?.trim()) return duration
  return '00:05'
}

function renderPreviewMedia(data: VideoCardData, title: string, className: string) {
  if (data.thumbnailUrl) {
    return (
      <img
        src={data.thumbnailUrl}
        alt={title}
        className={className}
      />
    )
  }

  if (data.contentType === 'video' && data.mediaUrl) {
    return (
      <video
        src={data.mediaUrl}
        className={className}
        muted
        playsInline
        preload="auto"
      />
    )
  }

  return null
}

/* ─── Component ──────────────────────────────────────── */

export function VideoCard({
  data,
  variant = 'default',
}: {
  data: VideoCardData
  variant?: 'default' | 'masonry'
}) {
  const t = useTranslations('explore')
  const authorName = getDisplayName(data.author.name)
  const meta = [
    data.views !== undefined ? `${formatViews(data.views)} views` : '',
    formatCreatedAt(data.createdAt),
  ]
    .filter(Boolean)
    .join(' · ')
  const summary = data.description?.trim() || meta

  if (variant === 'masonry') {
    return (
      <Link href={`/explore/${data.id}`} className="group mb-6 block break-inside-avoid">
        <article className="animate-explore-rise overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_22px_60px_-34px_rgba(15,23,42,0.28)] transition-[transform,box-shadow,border-color,filter] duration-300 group-hover:-translate-y-2 group-hover:border-brand-200 group-hover:shadow-[0_34px_90px_-38px_rgba(79,70,229,0.28)] group-hover:saturate-[1.03]">
          <div className="relative overflow-hidden bg-[linear-gradient(180deg,#fff9ea_0%,#fffefb_42%,#ffffff_100%)]">
            {renderPreviewMedia(
              data,
              data.title,
              'h-auto w-full object-contain transition-transform duration-700 group-hover:scale-[1.035]',
            ) ?? (
              <div className="flex min-h-[240px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_36%),linear-gradient(135deg,#fff7ed,#ffffff)] px-6 py-14">
                <span className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  {data.contentType ? t(`type_${data.contentType}`) : 'Preview'}
                </span>
              </div>
            )}

            <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-2">
              <span className="rounded-full border border-white/80 bg-white/88 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-stone-700 uppercase backdrop-blur-sm">
                {data.contentType ? t(`type_${data.contentType}`) : 'content'}
              </span>
              {data.categoryName ? (
                <span className="rounded-full bg-black/58 px-3 py-1 text-[11px] font-medium text-white/92 backdrop-blur-sm">
                  {data.categoryName}
                </span>
              ) : null}
            </div>

            {data.contentType === 'video' ? (
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Play size={18} className="ml-0.5 fill-current" />
                </div>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_46%,rgba(15,23,42,0.06)_74%,rgba(15,23,42,0.48)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-x-3 bottom-3 translate-y-5 rounded-[24px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,249,246,0.98),rgba(250,224,206,0.94))] p-3 opacity-0 shadow-[0_18px_38px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-4 sm:bottom-4 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/70 bg-white/80">
                  {data.author.avatarUrl ? (
                    <img
                      src={data.author.avatarUrl}
                      alt={authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-100 text-xs font-semibold text-brand-700">
                      {getInitial(authorName)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-semibold text-stone-900">{data.title}</h3>
                      <p className="mt-1 truncate text-xs text-stone-500">{authorName}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                      <Heart size={12} className="text-rose-500" />
                      {formatViews(data.views) || '0'}
                    </span>
                  </div>
                  {summary ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-600">{summary}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>{formatDuration(data.duration)}</span>
                      <span className="rounded-full bg-white/70 px-2 py-1">{t(`type_${data.contentType ?? 'workflow'}`)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/78 text-stone-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.55)]">
                        <Sparkles size={15} />
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/78 text-stone-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.55)]">
                        <Bookmark size={15} />
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/78 text-stone-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.55)]">
                        <Ellipsis size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {data.entityType === 'workflow' && data.nodeTypes && data.nodeTypes.length > 0 ? (
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5 transition-opacity duration-300 group-hover:opacity-0">
                {data.nodeTypes.slice(0, 3).map((nodeType) => (
                  <span
                    key={nodeType}
                    className="rounded-full bg-black/58 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm"
                  >
                    {nodeType}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/explore/${data.id}`} className="group block">
      {/* 缩略图 */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_44px_-24px_rgba(99,102,241,0.35)]">
        {renderPreviewMedia(
          data,
          data.title,
          'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]',
        ) ?? (
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

        {data.contentType === 'video' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <Play size={20} className="ml-0.5 fill-current" />
            </div>
          </div>
        ) : null}

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
