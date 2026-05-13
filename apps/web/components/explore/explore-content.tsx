/**
 * [INPUT]: 依赖 react 的 useEffect/useMemo/useState，依赖 next-intl 的 useLocale/useTranslations，
 *          依赖 @/components/explore/explore-tabs，
 *          依赖 @/components/explore/explore-grid，
 *          依赖 @/hooks/use-explore 的 useExplore，
 *          依赖 @/hooks/use-categories 的 useCategories，
 *          依赖 @/components/shared/video-card 的 VideoCardData，
 *          依赖 @/components/ui/button
 * [OUTPUT]: 对外提供 ExploreContent 客户端交互容器（轮播主体下移、圆点叠放到画面上、箭头半透明悬浮的纯图片 Banner + 两行分类/排序 + 瀑布流内容卡片）
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
  {
    image: '/explore/banners/04.png',
    altKey: 'bannerAlt4',
  },
  {
    image: '/explore/banners/05.png',
    altKey: 'bannerAlt5',
  },
  {
    image: '/explore/banners/06.png',
    altKey: 'bannerAlt6',
  },
] as const

const DEFAULT_SUBCATEGORY: Record<ExploreContentTypeTab, ExploreSubcategoryTab> = {
  all: 'all',
  image: 'all',
  video: 'all',
  workflow: 'all',
}

function getCarouselOffset(index: number, activeIndex: number, total: number) {
  const rawOffset = index - activeIndex

  if (rawOffset > total / 2) return rawOffset - total
  if (rawOffset < -total / 2) return rawOffset + total

  return rawOffset
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
  category_slug?: string
  author_name?: string | null
  author_avatar?: string
  content_type?: 'video' | 'image' | 'workflow'
  node_types?: string
}

const SUBCATEGORY_HINTS: Record<Exclude<ExploreSubcategoryTab, 'all'>, string[]> = {
  'photo-real': ['photo-real', 'photoreal', 'realistic', '写实'],
  comic: ['comic', '漫画'],
  visual: ['visual', '视觉', 'creative'],
  architecture: ['architecture', '建筑'],
  abstract: ['abstract', '抽象'],
  design: ['design', '设计'],
  anime: ['anime', '动漫', 'animation'],
  'text-gen': ['text-generation', 'text gen', '文本生成', 'llm', 'text-input'],
  'image-gen': ['image-generation', 'image gen', '图片生成', 'image-gen'],
  'video-gen': ['video-generation', 'video gen', '视频生成', 'video-gen'],
  'audio-gen': ['audio-generation', 'audio gen', '音频生成', 'audio-gen'],
  other: ['other', '其他'],
}

const SUBCATEGORY_CATEGORY_SLUGS: Partial<Record<ExploreSubcategoryTab, string[]>> = {
  'text-gen': ['text-generation'],
  'image-gen': ['image-generation'],
  'video-gen': ['video-generation'],
  'audio-gen': ['audio-generation'],
  visual: ['creative'],
  other: ['other'],
}

const SUBCATEGORY_TYPE_HINTS: Partial<Record<ExploreSubcategoryTab, string[]>> = {
  'text-gen': ['llm', 'text-input'],
  'image-gen': ['image-gen'],
  'video-gen': ['video-gen'],
  'audio-gen': ['audio-gen'],
}

interface ExploreApiResponse {
  items?: ExploreApiItem[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

function toVideoCard(
  item: ExploreApiItem,
  categoryMap: Map<string, string>,
  categorySlugMap: Map<string, string>,
): VideoCardData {
  const authorName = item.author_name?.trim() || 'Unknown Creator'
  const thumbnailUrl =
    item.content_type === 'video' && item.thumbnail === item.media_url ? undefined : item.thumbnail

  return {
    id: item.id,
    title: item.name,
    thumbnailUrl,
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
    categorySlug: item.category_slug ?? (item.category_id ? categorySlugMap.get(item.category_id) : undefined),
  }
}

function normalizeKeyword(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

function matchesSubcategory(video: VideoCardData, activeSubcategory: ExploreSubcategoryTab) {
  if (activeSubcategory === 'all') return true

  const normalizedCategory = normalizeKeyword(video.categoryName)
  const normalizedCategorySlug = normalizeKeyword(video.categorySlug)
  const normalizedNodeTypes = (video.nodeTypes ?? []).map((nodeType) => normalizeKeyword(nodeType))
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

  const categorySlugs = SUBCATEGORY_CATEGORY_SLUGS[activeSubcategory] ?? []
  const typeHints = SUBCATEGORY_TYPE_HINTS[activeSubcategory] ?? []
  const keywordHints = SUBCATEGORY_HINTS[activeSubcategory] ?? []

  if (
    categorySlugs.some(
      (slug) => normalizedCategorySlug.includes(slug) || normalizedCategory.includes(slug),
    )
  ) {
    return true
  }

  if (typeHints.some((hint) => normalizedNodeTypes.some((nodeType) => nodeType.includes(hint)))) {
    return true
  }

  return keywordHints.some((hint) => haystack.includes(hint))
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreContent() {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [activeSort, setActiveSort] = useState<ExploreTab>('hot')
  const [activeType, setActiveType] = useState<ExploreContentTypeTab>('all')
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
  const categorySlugMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.slug])),
    [categories],
  )

  const videos = useMemo(
    () => response?.items?.map((item) => toVideoCard(item, categoryMap, categorySlugMap)) ?? [],
    [categoryMap, categorySlugMap, response?.items],
  )

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => matchesSubcategory(video, activeSubcategory))
  }, [activeSubcategory, videos])

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
        <section className="animate-explore-rise relative -mt-7 px-1 pt-10 sm:px-2 sm:pt-12 lg:px-3 lg:pt-14">
          <div className="relative h-[232px] overflow-visible sm:h-[304px] lg:h-[384px]">
            {BANNERS.map((banner, index) => {
              const offset = getCarouselOffset(index, activeBanner, BANNERS.length)
              const isActive = offset === 0
              const isSideCard = Math.abs(offset) === 1
              const hidden = Math.abs(offset) > 1

              return (
                <button
                  key={banner.image}
                  type="button"
                  onClick={() => setActiveBanner(index)}
                  aria-label={`${t('switchBanner')} ${index + 1}`}
                  className={`absolute left-1/2 top-1/2 block h-[88%] w-[84%] -translate-y-1/2 overflow-hidden rounded-[24px] shadow-[0_24px_55px_-36px_rgba(15,23,42,0.28)] transition-all duration-500 ease-out sm:h-[90%] sm:w-[72%] lg:w-[60%] ${
                    hidden ? 'pointer-events-none opacity-0' : ''
                  }`}
                  style={{
                    zIndex: isActive ? 30 : isSideCard ? 20 : 10,
                    transform: `translate(-50%, calc(-50% + 128px)) perspective(1400px) translateX(${offset * 34}%) scale(${
                      isActive ? 1 : 0.86
                    }) rotateY(${offset * -24}deg)`,
                    opacity: isActive ? 1 : isSideCard ? 0.72 : 0,
                    filter: isActive ? 'none' : 'saturate(0.9) brightness(0.92)',
                  }}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={banner.image}
                      alt={t(banner.altKey)}
                      fill
                      sizes="(max-width: 1024px) 88vw, 980px"
                      className="object-cover"
                      priority={isActive}
                    />
                  </div>
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setActiveBanner((current) => (current - 1 + BANNERS.length) % BANNERS.length)}
              className="absolute left-[6%] top-1/2 z-40 inline-flex h-10 w-10 translate-y-[128px] -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 opacity-50 shadow-sm transition hover:bg-white hover:opacity-80"
              aria-label={t('bannerPrev')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActiveBanner((current) => (current + 1) % BANNERS.length)}
              className="absolute right-[6%] top-1/2 z-40 inline-flex h-10 w-10 translate-y-[128px] -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 opacity-50 shadow-sm transition hover:bg-white hover:opacity-80"
              aria-label={t('bannerNext')}
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute inset-x-0 bottom-[12%] z-40 flex justify-center gap-2">
            {BANNERS.map((banner, dotIndex) => (
              <button
                key={banner.image}
                type="button"
                onClick={() => setActiveBanner(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === activeBanner ? 'w-8 bg-stone-900/50' : 'w-2.5 bg-white/50'
                }`}
                aria-label={`${t('switchBanner')} ${dotIndex + 1}`}
              />
            ))}
            </div>
          </div>
        </section>

        <section className="animate-explore-rise px-1" style={{ animationDelay: '120ms' }}>
          <ExploreTabs
            activeSort={activeSort}
            activeType={activeType}
            activeSubcategory={activeSubcategory}
            onSortChange={handleSortChange}
            onTypeChange={handleTypeChange}
            onSubcategoryChange={handleSubcategoryChange}
          />
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
