/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 VideoCard 可复用内容卡片组件 (支持默认信息卡与 Explore 瀑布流 Z 轴浮动卡；hover 时底部贴边弹出高浓度毛玻璃详情层，仅消费稳定图片封面，避免列表态反复探测视频资源)
 * [POS]: shared 的通用内容卡，被 explore/workspace 页面消费；Explore 以强视觉模式复用并承接底部操作条
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 缩略图与头像都来自用户内容或运行时远程 URL，不适合额外域名约束。 */

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Download, Ellipsis, Flag, Heart, Play, Sparkles, Star } from 'lucide-react'
import { toast } from 'sonner'

import { Link, useRouter } from '@/i18n/navigation'
import { useCloneWorkflow, useReportWorkflow, useToggleFavorite, useToggleLike } from '@/hooks/use-explore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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
  likes?: number
  favorites?: number
  createdAt?: string
  nodeTypes?: string[]
  description?: string
  categoryName?: string
  categorySlug?: string
  favorited?: boolean
  liked?: boolean
}

/* ─── Helpers ────────────────────────────────────────── */

function getDisplayName(name: string | undefined, fallback: string): string {
  return name?.trim() || fallback
}

function getInitial(name: string | undefined, fallback: string): string {
  return getDisplayName(name, fallback).charAt(0).toUpperCase()
}

function formatViews(n?: number): string {
  if (!n) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatCreatedAt(value: string | undefined, locale: string): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatMetric(n?: number) {
  return formatViews(n) || '0'
}

function formatTypeLabel(
  t: ReturnType<typeof useTranslations<'explore'>>,
  contentType?: VideoCardData['contentType'],
) {
  return t(`type_${contentType ?? 'workflow'}`)
}

function renderPreviewMedia(
  imageUrl: string | undefined,
  title: string,
  className: string,
) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={className}
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
  const tDetail = useTranslations('exploreDetail')
  const locale = useLocale()
  const unknownCreator = t('unknownCreator')
  const authorName = getDisplayName(data.author.name, unknownCreator)
  const meta = [
    data.views !== undefined ? t('views', { count: data.views }) : '',
    formatCreatedAt(data.createdAt, locale),
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
      tDetail={tDetail}
      unknownCreator={unknownCreator}
    />
  )
}

function CardWithPreview({
  data,
  authorName,
  meta,
  variant,
  t,
  tDetail,
  unknownCreator,
}: {
  data: VideoCardData
  authorName: string
  meta: string
  variant: 'default' | 'masonry'
  t: ReturnType<typeof useTranslations<'explore'>>
  tDetail: ReturnType<typeof useTranslations<'exploreDetail'>>
  unknownCreator: string
}) {
  const [interactionState, setInteractionState] = useState(() => ({
    liked: Boolean(data.liked),
    favorited: Boolean(data.favorited),
    likeCount: data.likes ?? 0,
    favoriteCount: data.favorites ?? 0,
  }))

  if (variant === 'masonry') {
    const cardState =
      interactionState.liked === Boolean(data.liked) &&
      interactionState.favorited === Boolean(data.favorited) &&
      interactionState.likeCount === (data.likes ?? 0) &&
      interactionState.favoriteCount === (data.favorites ?? 0)
        ? interactionState
        : {
            liked: Boolean(data.liked),
            favorited: Boolean(data.favorited),
            likeCount: data.likes ?? 0,
            favoriteCount: data.favorites ?? 0,
          }

    return (
      <Link
        key={`${data.id}-${data.liked ? 1 : 0}-${data.favorited ? 1 : 0}-${data.likes ?? 0}-${data.favorites ?? 0}`}
        href={`/explore/${data.id}`}
        className="group relative z-0 mb-6 block break-inside-avoid overflow-visible transition-[z-index] duration-300 hover:z-30 focus-visible:z-30"
      >
        <article className="animate-explore-rise overflow-visible rounded-[32px] transition-transform duration-300 group-hover:scale-[1.018]">
          <div className="relative overflow-visible">
            <div className="overflow-hidden rounded-[30px] border border-stone-200/85 bg-white shadow-[0_22px_56px_-34px_rgba(15,23,42,0.22)] transition-[box-shadow,border-color,filter,border-radius] duration-300 group-hover:rounded-b-none group-hover:border-stone-300 group-hover:shadow-[0_38px_96px_-46px_rgba(15,23,42,0.34)]">
              <div className="relative overflow-hidden bg-stone-100">
                {renderPreviewMedia(
                  data.thumbnailUrl,
                  data.title,
                  'h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]',
                ) ?? (
                  <div className="flex min-h-[240px] items-center justify-center bg-stone-100 px-6 py-14">
                    <span className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                      {formatTypeLabel(t, data.contentType)}
                    </span>
                  </div>
                )}

                {data.contentType === 'video' ? (
                  <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <Play size={18} className="ml-0.5 fill-current" />
                    </div>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_44%,rgba(15,23,42,0.1)_70%,rgba(15,23,42,0.58)_100%)]" />

                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex max-w-[148px] translate-y-1 items-center gap-2.5 transition-transform duration-300 group-hover:translate-y-0 sm:max-w-[176px]">
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white/35 bg-white/20 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.7)] backdrop-blur-md">
                      {data.author.avatarUrl ? (
                        <img
                          src={data.author.avatarUrl}
                          alt={authorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/60 text-sm font-semibold text-stone-900">
                          {getInitial(authorName, unknownCreator)}
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 truncate text-[13px] font-semibold text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.55)]">
                      {authorName}
                    </span>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <MetricPill icon={<Heart size={12} className="text-rose-200" />} value={formatMetric(cardState.likeCount)} />
                    <MetricPill icon={<Star size={12} className="text-white/90" />} value={formatMetric(cardState.favoriteCount)} />
                    <MetricPill icon={<Play size={12} className="fill-current text-white/90" />} value={formatMetric(data.views)} />
                  </div>
                </div>
              </div>
            </div>

            <CardDetailPanel
              data={data}
              liked={cardState.liked}
              favorited={cardState.favorited}
              likeCount={cardState.likeCount}
              favoriteCount={cardState.favoriteCount}
              setInteractionState={setInteractionState}
              t={t}
              tDetail={tDetail}
            />
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/explore/${data.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_44px_-24px_rgba(99,102,241,0.35)]">
        {renderPreviewMedia(
          data.thumbnailUrl,
          data.title,
          'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]',
        ) ?? (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_45%),linear-gradient(135deg,rgba(248,250,252,0.9),rgba(226,232,240,0.75))]">
            <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground/80 uppercase">
              {t('noPreview')}
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
              {getInitial(authorName, unknownCreator)}
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

function CardDetailPanel({
  data,
  liked,
  favorited,
  likeCount,
  favoriteCount,
  setInteractionState,
  t,
  tDetail,
}: {
  data: VideoCardData
  liked: boolean
  favorited: boolean
  likeCount: number
  favoriteCount: number
  setInteractionState: React.Dispatch<
    React.SetStateAction<{
      liked: boolean
      favorited: boolean
      likeCount: number
      favoriteCount: number
    }>
  >
  t: ReturnType<typeof useTranslations<'explore'>>
  tDetail: ReturnType<typeof useTranslations<'exploreDetail'>>
}) {
  const router = useRouter()
  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleFavorite } = useToggleFavorite()
  const { mutate: clone, isPending: cloning } = useCloneWorkflow()
  const { mutate: report } = useReportWorkflow()

  const handleClone = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    clone(
      { id: data.id, entityType: data.entityType },
      {
        onSuccess: (result) => {
          toast.success(tDetail('cloneSuccess'))
          router.push(`/canvas/${result.id}`)
        },
        onError: () => toast.error(tDetail('cloneFailed')),
      },
    )
  }

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const nextLiked = !liked
    const nextLikeCount = Math.max(0, likeCount + (nextLiked ? 1 : -1))

    setInteractionState((prev) => ({
      ...prev,
      liked: nextLiked,
      likeCount: nextLikeCount,
    }))

    toggleLike(
      { id: data.id, entityType: data.entityType },
      {
        onSuccess: (result) => {
          const resolvedLiked =
            typeof (result as { liked?: boolean }).liked === 'boolean'
              ? Boolean((result as { liked?: boolean }).liked)
              : nextLiked
          setInteractionState((prev) => ({
            ...prev,
            liked: resolvedLiked,
          }))
        },
        onError: () => {
          setInteractionState((prev) => ({
            ...prev,
            liked,
            likeCount,
          }))
          toast.error(tDetail('actionFailed'))
        },
      },
    )
  }

  const handleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const nextFavorited = !favorited
    const nextFavoriteCount = Math.max(0, favoriteCount + (nextFavorited ? 1 : -1))

    setInteractionState((prev) => ({
      ...prev,
      favorited: nextFavorited,
      favoriteCount: nextFavoriteCount,
    }))

    toggleFavorite(
      { id: data.id, entityType: data.entityType },
      {
        onSuccess: (result) => {
          const resolvedFavorited =
            typeof (result as { favorited?: boolean }).favorited === 'boolean'
              ? Boolean((result as { favorited?: boolean }).favorited)
              : nextFavorited
          setInteractionState((prev) => ({
            ...prev,
            favorited: resolvedFavorited,
          }))
        },
        onError: () => {
          setInteractionState((prev) => ({
            ...prev,
            favorited,
            favoriteCount,
          }))
          toast.error(tDetail('actionFailed'))
        },
      },
    )
  }

  const handleDownload = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!data.mediaUrl && !data.thumbnailUrl) {
      toast.error(tDetail('downloadUnavailable'))
      return
    }

    const anchor = document.createElement('a')
    anchor.href = data.mediaUrl ?? data.thumbnailUrl ?? '#'
    anchor.target = '_blank'
    anchor.rel = 'noreferrer'
    anchor.download = ''
    anchor.click()
  }

  const handleReport = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    report(
      {
        id: data.id,
        entityType: data.entityType,
        reason: 'other',
      },
      {
        onSuccess: () => toast.success(tDetail('reportSubmitted')),
        onError: () => toast.error(tDetail('reportFailed')),
      },
    )
  }

  const tagItems = [
    data.contentType ? formatTypeLabel(t, data.contentType) : null,
    data.categoryName ?? null,
    ...(data.nodeTypes?.slice(0, 3) ?? []),
  ].filter(Boolean) as string[]

  return (
    <div className="pointer-events-none absolute inset-x-0 top-full z-20 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
      <div className="translate-y-[-10px] overflow-hidden rounded-b-[30px] rounded-t-none border border-stone-200/95 border-t-0 bg-[rgba(255,255,255,0.88)] shadow-[0_28px_60px_-36px_rgba(15,23,42,0.24)] transition-transform duration-300 group-hover:translate-y-0">
        <div className="relative p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px] items-center gap-2">
            <Button
              type="button"
              onClick={handleClone}
              disabled={cloning}
              className="h-11 w-full justify-center rounded-full bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-900"
            >
              <Sparkles size={15} />
              {cloning ? tDetail('generatePending') : tDetail('generateNow')}
            </Button>
            <IconButton
              active={liked}
              label={t('likes', { count: likeCount })}
              onClick={handleLike}
            >
              <Heart size={16} className={cn(liked && 'fill-current')} />
            </IconButton>
            <IconButton
              active={favorited}
              label={favorited ? tDetail('favorited') : tDetail('favoriteNow')}
              onClick={handleFavorite}
            >
              <Star size={16} className={cn(favorited && 'fill-current')} />
            </IconButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-800 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] transition hover:bg-stone-50"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  aria-label={t('moreActions')}
                >
                  <Ellipsis size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-2xl border-stone-200 bg-white p-2 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.2)]"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                >
                <DropdownMenuItem onSelect={handleReport}>
                  <Flag size={14} />
                  {tDetail('report')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDownload}>
                  <Download size={14} />
                  {tDetail('download')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4">
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-6 text-stone-950">
              {data.title}
            </h3>
          </div>

          {tagItems.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tagItems.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          </div>
      </div>
    </div>
  )
}

function MetricPill({
  icon,
  value,
}: {
  icon: React.ReactNode
  value: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-black/28 px-2.5 py-1 text-[11px] font-medium text-white/95 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.7)] backdrop-blur-md">
      {icon}
      {value}
    </span>
  )
}

function IconButton({
  active = false,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-800 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.18)] transition hover:bg-stone-50',
        active && 'border-rose-200/95 bg-rose-50/92 text-rose-600',
      )}
    >
      {children}
    </button>
  )
}
