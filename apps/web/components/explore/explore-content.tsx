/**
 * [INPUT]: 依赖 react 的 useEffect/useMemo/useRef/useState，依赖 next-intl 的 useLocale/useTranslations，
 *          依赖 @/components/explore/explore-tabs，
 *          依赖 @/components/explore/explore-grid，
 *          依赖 @/hooks/use-explore 的 useExplore，
 *          依赖 @/hooks/use-categories 的 useCategories，
 *          依赖 @/components/shared/video-card 的 VideoCardData，
 * [OUTPUT]: 对外提供 ExploreContent 客户端交互容器（降低裁剪的纯图片 Banner + 两行分类/排序 + 瀑布流内容卡片 + 无尽下拉加载）
 * [POS]: explore 的客户端组合组件，被 explore/page.tsx 消费，是社区广场主展示层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

import {
  ExploreTabs,
  type ExploreContentTypeTab,
  type ExploreSubcategoryTab,
  type ExploreTab,
} from './explore-tabs'
import { ExploreGrid } from './explore-grid'
import { useExplore } from '@/hooks/use-explore'
import { useCategories } from '@/hooks/use-categories'
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

function dedupeVideoCards(videos: VideoCardData[]) {
  const seenIds = new Set<string>()
  const seenPreviewKeys = new Set<string>()

  return videos.filter((video) => {
    if (seenIds.has(video.id)) return false
    seenIds.add(video.id)

    const previewKey = video.thumbnailUrl?.trim() || video.mediaUrl?.trim()
    if (!previewKey) return true

    if (seenPreviewKeys.has(previewKey)) return false

    seenPreviewKeys.add(previewKey)
    return true
  })
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreContent() {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [activeSort, setActiveSort] = useState<ExploreTab>('hot')
  const [activeType, setActiveType] = useState<ExploreContentTypeTab>('all')
  const [activeSubcategory, setActiveSubcategory] = useState<ExploreSubcategoryTab>('all')
  const [activeBanner, setActiveBanner] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { data: categories = [] } = useCategories(locale)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useExplore({
    sort: TAB_SORT[activeSort],
    type: activeType,
    limit: 20,
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % BANNERS.length)
    }, 4800)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasNextPage) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '900px 0px 900px 0px' },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )
  const categorySlugMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.slug])),
    [categories],
  )

  const allItems = useMemo(
    () =>
      (data?.pages ?? []).flatMap(
        (page) => ((page as ExploreApiResponse | undefined)?.items ?? []),
      ),
    [data?.pages],
  )

  const videos = useMemo(
    () => dedupeVideoCards(allItems.map((item) => toVideoCard(item, categoryMap, categorySlugMap))),
    [allItems, categoryMap, categorySlugMap],
  )

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => matchesSubcategory(video, activeSubcategory))
  }, [activeSubcategory, videos])

  const handleSortChange = (tab: ExploreTab) => {
    setActiveSort(tab)
  }

  const handleTypeChange = (tab: ExploreContentTypeTab) => {
    setActiveType(tab)
    setActiveSubcategory(DEFAULT_SUBCATEGORY[tab])
  }

  const handleSubcategoryChange = (subcategory: ExploreSubcategoryTab) => {
    setActiveSubcategory(subcategory)
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-[#f7f7f5]">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-3 py-6 sm:px-4 lg:px-5 xl:px-6 2xl:px-8 lg:py-8">
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
                  <div className="relative h-full w-full bg-[radial-gradient(circle_at_top,#f6f1c9_0%,#efe6a4_26%,#ded6bf_100%)]">
                    <Image
                      src={banner.image}
                      alt={t(banner.altKey)}
                      fill
                      sizes="(max-width: 1024px) 88vw, 980px"
                      className="object-contain object-center"
                      priority={isActive}
                    />
                  </div>
                </button>
              )
            })}

            <div className="absolute inset-x-0 top-1/2 z-40 flex translate-y-[44px] justify-center gap-2 sm:translate-y-[62px] lg:translate-y-[82px]">
              {BANNERS.map((banner, dotIndex) => (
                <button
                  key={banner.image}
                  type="button"
                  onClick={() => setActiveBanner(dotIndex)}
                  className={`h-2.5 rounded-full transition-all ${
                    dotIndex === activeBanner ? 'w-8 bg-stone-950/70' : 'w-2.5 bg-white/80'
                  }`}
                  aria-label={`${t('switchBanner')} ${dotIndex + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="animate-explore-rise -mt-6 px-1" style={{ animationDelay: '120ms' }}>
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

        <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center pb-6">
          {isFetchingNextPage ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              {t('loading')}
            </div>
          ) : hasNextPage ? (
            <div className="h-8 w-full" />
          ) : filteredVideos.length > 0 ? (
            <p className="text-sm text-muted-foreground/70">{t('noMoreResults')}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
