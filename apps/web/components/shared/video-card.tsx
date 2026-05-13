/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 VideoCard 可复用内容卡片组件 (支持默认信息卡与 Explore 瀑布流悬浮卡；视频优先图片封面、失败时回退首帧或视频预览)
 * [POS]: shared 的通用内容卡，被 explore/workspace 页面消费；Explore 以强视觉模式复用并承接底部操作条
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 缩略图与头像都来自用户内容或运行时远程 URL，不适合额外域名约束。 */

import { useEffect, useState } from 'react'
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
  categorySlug?: string
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

function formatMetric(n?: number) {
  return formatViews(n) || '0'
}

function getVideoFrameDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url

    const cleanup = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    const capture = () => {
      try {
        const width = video.videoWidth
        const height = video.videoHeight

        if (!width || !height) {
          cleanup()
          resolve(null)
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')

        if (!context) {
          cleanup()
          resolve(null)
          return
        }

        context.drawImage(video, 0, 0, width, height)
        const result = canvas.toDataURL('image/jpeg', 0.82)
        cleanup()
        resolve(result)
      } catch {
        cleanup()
        resolve(null)
      }
    }

    video.addEventListener(
      'loadedmetadata',
      () => {
        try {
          video.currentTime = Math.min(0.05, Number.isFinite(video.duration) ? video.duration / 2 : 0.05)
        } catch {
          capture()
        }
      },
      { once: true },
    )

    video.addEventListener(
      'loadeddata',
      () => {
        if (video.readyState >= 2) {
          capture()
        }
      },
      { once: true },
    )

    video.addEventListener(
      'seeked',
      () => {
        capture()
      },
      { once: true },
    )

    video.addEventListener(
      'error',
      () => {
        cleanup()
        resolve(null)
      },
      { once: true },
    )
  })
}

function useVideoPreviewFrame(frameSourceKey?: string) {
  const [previewFrameState, setPreviewFrameState] = useState<{
    sourceKey?: string
    frameUrl?: string
  }>({})

  useEffect(() => {
    let cancelled = false

    if (!frameSourceKey) {
      return undefined
    }

    void getVideoFrameDataUrl(frameSourceKey).then((frameUrl) => {
      if (!cancelled) {
        setPreviewFrameState({
          sourceKey: frameSourceKey,
          frameUrl: frameUrl ?? undefined,
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [frameSourceKey])

  if (!frameSourceKey || previewFrameState.sourceKey !== frameSourceKey) {
    return undefined
  }

  return previewFrameState.frameUrl
}

function renderPreviewMedia(
  data: VideoCardData,
  title: string,
  className: string,
  activePreviewImageUrl?: string,
  onPreviewImageError?: () => void,
) {
  if (activePreviewImageUrl) {
    return (
      <img
        src={activePreviewImageUrl}
        alt={title}
        className={className}
        onError={onPreviewImageError}
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
        preload="metadata"
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

  return (
    <CardWithPreview
      data={data}
      authorName={authorName}
      meta={meta}
      variant={variant}
      t={t}
    />
  )
}

function CardWithPreview({
  data,
  authorName,
  meta,
  variant,
  t,
}: {
  data: VideoCardData
  authorName: string
  meta: string
  variant: 'default' | 'masonry'
  t: ReturnType<typeof useTranslations<'explore'>>
}) {
  const frameSourceKey =
    data.contentType === 'video' && data.mediaUrl ? data.mediaUrl : undefined
  const previewFrameUrl = useVideoPreviewFrame(frameSourceKey)
  const [failedPreviewUrls, setFailedPreviewUrls] = useState<string[]>([])
  const previewImageCandidates = [data.thumbnailUrl, previewFrameUrl].filter(
    (value): value is string => Boolean(value),
  )
  const activePreviewImageUrl = previewImageCandidates.find(
    (candidate) => !failedPreviewUrls.includes(candidate),
  )

  const handlePreviewImageError = () => {
    if (!activePreviewImageUrl) return
    setFailedPreviewUrls((current) =>
      current.includes(activePreviewImageUrl)
        ? current
        : [...current, activePreviewImageUrl],
    )
  }

  if (variant === 'masonry') {
    const summary = data.description?.trim() || meta

    return (
      <Link href={`/explore/${data.id}`} className="group mb-6 block break-inside-avoid">
        <article className="animate-explore-rise overflow-hidden rounded-[30px] border border-stone-200/85 bg-white shadow-[0_22px_56px_-34px_rgba(15,23,42,0.22)] transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-2 group-hover:border-stone-300 group-hover:shadow-[0_34px_88px_-42px_rgba(15,23,42,0.32)]">
          <div className="relative overflow-hidden bg-stone-100">
            {renderPreviewMedia(
              data,
              data.title,
              'h-auto w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]',
              activePreviewImageUrl,
              handlePreviewImageError,
            ) ?? (
              <div className="flex min-h-[240px] items-center justify-center bg-stone-100 px-6 py-14">
                <span className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  {data.contentType ? t(`type_${data.contentType}`) : 'Preview'}
                </span>
              </div>
            )}

            <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-2 sm:left-4 sm:top-4 sm:right-4">
              <span className="rounded-full border border-white/80 bg-white/92 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-stone-700 uppercase backdrop-blur-sm">
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

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_48%,rgba(15,23,42,0.08)_72%,rgba(15,23,42,0.52)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-x-3 bottom-3 translate-y-5 rounded-[24px] border border-white/45 bg-[rgba(255,255,255,0.9)] p-3 opacity-0 shadow-[0_18px_38px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-4 sm:bottom-4 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white/90">
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
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-stone-900">
                        {data.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500">
                        <span className="truncate font-medium text-stone-700">{authorName}</span>
                        <span>{formatCreatedAt(data.createdAt)}</span>
                      </div>
                    </div>
                    <div className="rounded-full bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white">
                      {formatDuration(data.duration)}
                    </div>
                  </div>
                  {summary ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-600">{summary}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-200/80 pt-3">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
                        <Heart size={12} className="text-rose-500" />
                        {formatMetric(data.views)}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
                        {t(`type_${data.contentType ?? 'workflow'}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.2)]">
                        <Sparkles size={15} />
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.2)]">
                        <Bookmark size={15} />
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.2)]">
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
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_44px_-24px_rgba(99,102,241,0.35)]">
        {renderPreviewMedia(
          data,
          data.title,
          'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]',
          activePreviewImageUrl,
          handlePreviewImageError,
        ) ?? (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_45%),linear-gradient(135deg,rgba(248,250,252,0.9),rgba(226,232,240,0.75))]">
            <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground/80 uppercase">
              No Preview
            </span>
          </div>
        )}

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

        {data.entityType === 'workflow' && data.nodeTypes && data.nodeTypes.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {data.nodeTypes.slice(0, 3).map((nodeType) => (
              <span
                key={nodeType}
                className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm"
              >
                {nodeType}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 px-1">
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

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-6 text-foreground transition-colors group-hover:text-brand-600">
            {data.title}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{authorName}</p>
          {meta ? <p className="text-xs text-muted-foreground/75">{meta}</p> : null}
        </div>
      </div>
    </Link>
  )
}
