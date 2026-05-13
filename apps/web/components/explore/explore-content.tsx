/**
 * [INPUT]: 依赖 react 的 useEffect/useMemo/useState，依赖 next-intl 的 useLocale/useTranslations，
 *          依赖 @/components/explore/explore-tabs，
 *          依赖 @/components/explore/explore-grid，
 *          依赖 @/hooks/use-explore 的 useExplore，
 *          依赖 @/hooks/use-categories 的 useCategories，
 *          依赖 @/components/shared/video-card 的 VideoCardData，
 *          依赖 @/components/ui/button
 * [OUTPUT]: 对外提供 ExploreContent 客户端交互容器（纯图片轮播 Banner + 两行分类/排序 + 瀑布流内容卡片）
 * [POS]: explore 的客户端组合组件，被 explore/page.tsx 消费，是社区广场主展示层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  ExploreTabs,
  type ExploreContentTypeTab,
  type ExploreSubcategoryTab,
  type ExploreTab,
} from './explore-tabs'
import { ExploreGrid } from './explore-grid'
import { useExplore } from '@/hooks/use-explore'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import type { VideoCardData } from '@/components/shared/video-card'
import type { ExploreQuery } from '@/lib/validations/explore'

/* ─── Tab → API Sort Mapping ─────────────────────────── */

const TAB_SORT: Record<ExploreTab, ExploreQuery['sort']> = {
  hot: 'popular',
  latest: 'latest',
  myLiked: 'most-liked',
}

const BANNERS = [
  {
    image: '/explore/banners/01.png',
    altKey: 'bannerAlt1',
  },
  {
    image: '/explore/banners/02.png',
    altKey: 'bannerAlt2',
  },
  {
    image: '/explore/banners/03.png',
    altKey: 'bannerAlt3',
  },
] as const

const DEFAULT_SUBCATEGORY: Record<ExploreContentTypeTab, ExploreSubcategoryTab> = {
  image: 'all',
  video: 'all',
  workflow: 'all',
}

/* ─── D1 → VideoCardData 映射 ────────────────────────── */

interface ExploreApiItem {
  entity_type?: 'workflow' | 'output'
  id: string
  name: string
  description?: string
  thumbnail?: string
  media_url?: string
  like_count: number
  clone_count: number
  view_count: number
  published_at?: string
  category_id?: string
  author_name?: string | null
  author_avatar?: string
  content_type?: 'video' | 'image' | 'workflow'
  node_types?: string
}

interface ExploreApiResponse {
  items?: ExploreApiItem[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

function toVideoCard(item: ExploreApiItem, categoryMap: Map<string, string>): VideoCardData {
  const authorName = item.author_name?.trim() || 'Unknown Creator'

  return {
    id: item.id,
    title: item.name,
    thumbnailUrl: item.thumbnail,
    mediaUrl: item.media_url,
    contentType: item.content_type,
    entityType: item.entity_type,
    author: {
      name: authorName,
      avatarUrl: item.author_avatar,
    },
    views: item.view_count,
    createdAt: item.published_at,
    nodeTypes: item.node_types?.split(',').filter(Boolean),
    description: item.description,
    categoryName: item.category_id ? categoryMap.get(item.category_id) : undefined,
  }
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreContent() {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [activeSort, setActiveSort] = useState<ExploreTab>('hot')
  const [activeType, setActiveType] = useState<ExploreContentTypeTab>('image')
  const [activeSubcategory, setActiveSubcategory] = useState<ExploreSubcategoryTab>('all')
  const [page, setPage] = useState(1)
  const [activeBanner, setActiveBanner] = useState(0)

  const { data: categories = [] } = useCategories(locale)
  const { data, isLoading } = useExplore({
    sort: TAB_SORT[activeSort],
    type: activeType,
    page,
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % BANNERS.length)
    }, 4800)

    return () => window.clearInterval(timer)
  }, [])

  const response = data as ExploreApiResponse | undefined
  const pagination = response?.pagination

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const videos = useMemo(
    () => response?.items?.map((item) => toVideoCard(item, categoryMap)) ?? [],
    [categoryMap, response?.items],
  )

  const subcategoryLabel = t(`subcategory_${activeSubcategory}`)

  const filteredVideos = useMemo(() => {
    if (activeSubcategory === 'all') return videos

    return videos.filter((video) => {
      const haystack = [
        video.title,
        video.author.name,
        video.description,
        video.categoryName,
        ...(video.nodeTypes ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(subcategoryLabel.toLowerCase())
    })
  }, [activeSubcategory, subcategoryLabel, videos])

  const handleSortChange = (tab: ExploreTab) => {
    setActiveSort(tab)
    setPage(1)
  }

  const handleTypeChange = (tab: ExploreContentTypeTab) => {
    setActiveType(tab)
    setActiveSubcategory(DEFAULT_SUBCATEGORY[tab])
    setPage(1)
  }

  const handleSubcategoryChange = (subcategory: ExploreSubcategoryTab) => {
    setActiveSubcategory(subcategory)
    setPage(1)
  }

  return (
    <div className="min-h-full bg-[#f7f7f5]">
      <div className="mx-auto flex w-full max-w-[1640px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="animate-explore-rise relative overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_-34px_rgba(15,23,42,0.18)]">
          <div className="relative aspect-[16/6] min-h-[180px] sm:min-h-[240px]">
            <Image
              src={BANNERS[activeBanner].image}
              alt={t(BANNERS[activeBanner].altKey)}
              fill
              sizes="(max-width: 1024px) 100vw, 1400px"
              className="object-cover"
              priority
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveBanner((current) => (current - 1 + BANNERS.length) % BANNERS.length)}
            className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-stone-700 shadow-sm transition hover:bg-white"
            aria-label={t('bannerPrev')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setActiveBanner((current) => (current + 1) % BANNERS.length)}
            className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-stone-700 shadow-sm transition hover:bg-white"
            aria-label={t('bannerNext')}
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {BANNERS.map((banner, dotIndex) => (
              <button
                key={banner.image}
                type="button"
                onClick={() => setActiveBanner(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === activeBanner ? 'w-8 bg-white' : 'w-2.5 bg-white/65'
                }`}
                aria-label={`${t('switchBanner')} ${dotIndex + 1}`}
              />
            ))}
          </div>
        </section>

        <section
          className="animate-explore-rise rounded-[28px] border border-stone-200 bg-white px-4 py-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.12)] sm:rounded-[32px] sm:px-6 sm:py-5 lg:px-7"
          style={{ animationDelay: '120ms' }}
        >
          <div className="space-y-5">
            <ExploreTabs
              activeSort={activeSort}
              activeType={activeType}
              activeSubcategory={activeSubcategory}
              onSortChange={handleSortChange}
              onTypeChange={handleTypeChange}
              onSubcategoryChange={handleSubcategoryChange}
            />
          </div>
        </section>

        <section
          className="animate-explore-rise flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          style={{ animationDelay: '180ms' }}
        >
          <div className="min-w-0">
            <h3 className="text-[1.75rem] font-semibold tracking-tight text-stone-900 sm:text-[2rem]">
              {t('sectionTitle')}
            </h3>
            <p className="mt-2 text-sm text-stone-500">{t('sectionSubtitle')}</p>
          </div>
          <p className="text-sm text-stone-500 sm:text-right">
            {filteredVideos.length} {t('resultsCount')}
          </p>
        </section>

        <ExploreGrid videos={filteredVideos} isLoading={isLoading} />

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pb-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-full border-stone-300 bg-white px-4"
            >
              <ChevronLeft size={14} className="mr-1" />
              {t('prev')}
            </Button>

            <span className="text-sm text-muted-foreground">
              {page} / {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full border-stone-300 bg-white px-4"
            >
              {t('next')}
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
