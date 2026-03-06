/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/shared/video-card，
 *          依赖 @/components/ui/skeleton
 * [OUTPUT]: 对外提供 ExploreGrid 视频卡片网格 + 加载骨架
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
    <div>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="mt-2 flex gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

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
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {videos.map((video) => (
        <VideoCard key={video.id} data={video} />
      ))}
    </div>
  )
}
