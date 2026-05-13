/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/shared/video-card，
 *          依赖 @/components/ui/skeleton
 * [OUTPUT]: 对外提供 ExploreGrid 瀑布流卡片区域 + 加载骨架
 * [POS]: explore 的内容区域，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { VideoCard, type VideoCardData } from '@/components/shared/video-card'
import { Skeleton } from '@/components/ui/skeleton'

/* ─── Skeleton ───────────────────────────────────────── */

function VideoCardSkeleton() {
  return (
    <div className="mb-6 break-inside-avoid overflow-hidden rounded-[28px] border border-stone-200/70 bg-white p-3 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.22)]">
      <Skeleton className="h-[260px] w-full rounded-[22px]" />
      <div className="mt-4 space-y-2 px-1 pb-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
    </div>
  )
}

const GRID_CLASS = 'columns-1 gap-4 sm:columns-2 sm:gap-4 xl:columns-3 2xl:columns-4'

/* ─── Component ──────────────────────────────────────── */

export function ExploreGrid({
  videos,
  isLoading,
}: {
  videos?: VideoCardData[]
  isLoading: boolean
}) {
  const t = useTranslations('common')

  if (isLoading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 12 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!videos?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">{t('noResults')}</p>
      </div>
    )
  }

  return (
    <div className={GRID_CLASS}>
      {videos.map((video) => (
        <VideoCard key={video.id} data={video} variant="masonry" />
      ))}
    </div>
  )
}
