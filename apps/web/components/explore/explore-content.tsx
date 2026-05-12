/**
 * [INPUT]: 依赖 react 的 useEffect/useMemo/useState，依赖 next-intl 的 useLocale/useTranslations，
 *          依赖 @/components/explore/explore-tabs，
 *          依赖 @/components/explore/explore-grid，
 *          依赖 @/hooks/use-explore 的 useExplore，
 *          依赖 @/hooks/use-categories 的 useCategories，
 *          依赖 @/components/shared/video-card 的 VideoCardData，
 *          依赖 @/components/ui/button
 * [OUTPUT]: 对外提供 ExploreContent 客户端交互容器 (促销条 + 轮播 Banner + 分类/搜索/排序 + 瀑布流内容卡片)
 * [POS]: explore 的客户端组合组件，被 explore/page.tsx 消费，是社区广场主展示层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Flame, SearchCheck, X } from 'lucide-react'

import { ExploreTabs, type ExploreContentTypeTab, type ExploreTab } from './explore-tabs'
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
    accent: 'from-[#ff8a3d] via-[#fb7185] to-[#ffd84d]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,255,255,0.24),rgba(255,255,255,0.02))]',
    eyebrowKey: 'bannerEyebrow1',
    titleKey: 'bannerTitle1',
    bodyKey: 'bannerBody1',
  },
  {
    accent: 'from-[#111827] via-[#0f3fb2] to-[#6aa8ff]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]',
    eyebrowKey: 'bannerEyebrow2',
    titleKey: 'bannerTitle2',
    bodyKey: 'bannerBody2',
  },
  {
    accent: 'from-[#1f4d31] via-[#22c55e] to-[#f6e27a]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]',
    eyebrowKey: 'bannerEyebrow3',
    titleKey: 'bannerTitle3',
    bodyKey: 'bannerBody3',
  },
] as const

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
  const [activeTab, setActiveTab] = useState<ExploreTab>('hot')
  const [activeType, setActiveType] = useState<ExploreContentTypeTab>('all')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [searchValue, setSearchValue] = useState('')
  const [promoVisible, setPromoVisible] = useState(true)
  const [activeBanner, setActiveBanner] = useState(0)

  const { data: categories = [] } = useCategories(locale)
  const { data, isLoading } = useExplore({
    category: activeCategory === 'all' ? undefined : activeCategory,
    sort: TAB_SORT[activeTab],
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

  const filteredVideos = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return videos

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

      return haystack.includes(query)
    })
  }, [searchValue, videos])

  const handleTabChange = (tab: ExploreTab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleTypeChange = (tab: ExploreContentTypeTab) => {
    setActiveType(tab)
    setPage(1)
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    setPage(1)
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,#fff6d8_0%,#fffdf7_18%,#fffefb_35%,#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.2),transparent_26%)]" />
      <div className="mx-auto flex w-full max-w-[1640px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {promoVisible ? (
          <section className="animate-explore-rise relative overflow-hidden flex items-center justify-between gap-4 rounded-[24px] border border-[#f4dc68] bg-[#fff45b] px-5 py-3 text-sm text-stone-800 shadow-[0_14px_32px_-28px_rgba(202,138,4,0.68)]">
            <div className="absolute inset-y-0 right-0 w-40 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35))]" />
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Flame size={15} className="text-amber-700" />
                {t('promoTitle')}
              </span>
              <span className="rounded-full border border-black/10 bg-white/65 px-3 py-1 text-xs font-semibold">
                {t('promoCountdown')}
              </span>
              <span className="text-stone-700">{t('promoBody')}</span>
            </div>
            <button
              type="button"
              onClick={() => setPromoVisible(false)}
              className="rounded-full p-2 text-stone-700 transition-colors hover:bg-black/5 hover:text-stone-950"
              aria-label={t('closePromo')}
            >
              <X size={18} />
            </button>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          {BANNERS.slice(0, 2).map((banner, index) => {
            const isActive = index === activeBanner % 2
            return (
              <article
                key={banner.titleKey}
                className={`animate-explore-rise relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br ${banner.accent} p-6 text-white shadow-[0_28px_80px_-34px_rgba(15,23,42,0.4)] transition-all duration-500 ${
                  isActive ? 'translate-y-0 opacity-100' : 'opacity-78 xl:translate-y-1 xl:scale-[0.99]'
                }`}
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
                <div className="absolute -right-8 top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex min-h-[208px] flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold tracking-[0.22em] text-white/78 uppercase">
                      {t(banner.eyebrowKey)}
                    </p>
                    <h2 className="max-w-[15ch] text-2xl font-semibold tracking-tight sm:text-3xl">
                      {t(banner.titleKey)}
                    </h2>
                    <p className="max-w-[40ch] text-sm leading-6 text-white/84">{t(banner.bodyKey)}</p>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className={`rounded-[24px] ${banner.panel} px-4 py-3 backdrop-blur-md`}>
                      <p className="text-[11px] font-semibold tracking-[0.18em] text-white/68 uppercase">
                        {t('bannerStatLabel')}
                      </p>
                      <p className="mt-1 text-lg font-semibold">{t(index === 0 ? 'bannerStatValue1' : 'bannerStatValue2')}</p>
                    </div>
                    {BANNERS.slice(0, 2).map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        type="button"
                        onClick={() => setActiveBanner(dotIndex)}
                        className={`h-2.5 rounded-full transition-all ${
                          dotIndex === activeBanner % 2 ? 'w-8 bg-white' : 'w-2.5 bg-white/45'
                        }`}
                        aria-label={`${t('switchBanner')} ${dotIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <section className="animate-explore-rise rounded-[32px] border border-[#efe5d7] bg-white/88 px-4 py-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.15)] backdrop-blur-sm sm:px-6 lg:px-7" style={{ animationDelay: '120ms' }}>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === 'all'
                    ? 'bg-brand-500 text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.9)]'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {t('category_all')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-brand-500 text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.9)]'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <ExploreTabs
              active={activeTab}
              activeType={activeType}
              searchValue={searchValue}
              onChange={handleTabChange}
              onTypeChange={handleTypeChange}
              onSearchChange={setSearchValue}
            />
          </div>
        </section>

        <section className="animate-explore-rise flex items-center justify-between gap-4 px-1" style={{ animationDelay: '180ms' }}>
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-stone-400 uppercase">
              {t('sectionEyebrow')}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-[2rem]">
              {t('sectionTitle')}
            </h3>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-stone-500">
              <SearchCheck size={16} className="text-brand-500" />
              {t('sectionSubtitle')}
            </p>
          </div>
          <p className="text-sm text-stone-500">
            {filteredVideos.length} {t('resultsCount')}
          </p>
        </section>

        <ExploreGrid videos={filteredVideos} isLoading={isLoading} />

        {pagination && pagination.totalPages > 1 && !searchValue.trim() ? (
          <div className="flex items-center justify-center gap-3 pb-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-full border-stone-300 bg-white/82 px-4"
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
              className="rounded-full border-stone-300 bg-white/82 px-4"
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
