/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/explore/explore-tabs，
 *          依赖 @/components/explore/explore-grid，
 *          依赖 @/hooks/use-explore 的 useExplore，
 *          依赖 @/components/shared/search-command 的 SearchCommand/useSearchShortcut，
 *          依赖 @/components/ui/button，
 *          依赖 @/components/shared/video-card 的 VideoCardData
 * [OUTPUT]: 对外提供 ExploreContent 客户端交互容器 (含分页、作品类型分流与探索搜索入口)
 * [POS]: explore 的客户端组合组件，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { ExploreTabs, type ExploreContentTypeTab, type ExploreTab } from './explore-tabs'
import { ExploreGrid } from './explore-grid'
import { useExplore } from '@/hooks/use-explore'
import { SearchCommand, useSearchShortcut } from '@/components/shared/search-command'
import { Button } from '@/components/ui/button'
import type { VideoCardData } from '@/components/shared/video-card'

/* ─── Tab → API Sort Mapping ─────────────────────────── */

const TAB_SORT: Record<ExploreTab, string> = {
  hot: 'popular',
  latest: 'latest',
  myLiked: 'most-liked',
  myVideos: 'mine',
}

/* ─── D1 → VideoCardData 映射 ────────────────────────── */

interface ExploreApiItem {
  id: string
  name: string
  description?: string
  thumbnail?: string
  like_count: number
  clone_count: number
  view_count: number
  published_at?: string
  category_id?: string
  author_name: string
  author_avatar?: string
  content_type?: 'video' | 'image' | 'workflow'
  node_types?: string
}

interface ExploreApiResponse {
  items?: ExploreApiItem[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

function toVideoCard(item: ExploreApiItem): VideoCardData {
  return {
    id: item.id,
    title: item.name,
    thumbnailUrl: item.thumbnail,
    contentType: item.content_type,
    author: {
      name: item.author_name,
      avatarUrl: item.author_avatar,
    },
    views: item.view_count,
    createdAt: item.published_at,
    nodeTypes: item.node_types?.split(',').filter(Boolean),
  }
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreContent() {
  const t = useTranslations('explore')
  const ts = useTranslations('search')
  const [activeTab, setActiveTab] = useState<ExploreTab>('hot')
  const [activeType, setActiveType] = useState<ExploreContentTypeTab>('all')
  const [page, setPage] = useState(1)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  useSearchShortcut(openSearch)

  const { data, isLoading } = useExplore({
    sort: TAB_SORT[activeTab],
    type: activeType,
    page,
  })

  /* 切换 tab 时重置分页 */
  const handleTabChange = (tab: ExploreTab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleTypeChange = (tab: ExploreContentTypeTab) => {
    setActiveType(tab)
    setPage(1)
  }

  const response = data as ExploreApiResponse | undefined
  const videos = response?.items?.map(toVideoCard)
  const pagination = response?.pagination

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-5">
      {/* 标签栏 */}
      <ExploreTabs
        active={activeTab}
        activeType={activeType}
        onChange={handleTabChange}
        onTypeChange={handleTypeChange}
        onSearchOpen={openSearch}
        searchLabel={ts('title')}
      />

      {/* 视频网格 */}
      <div className="mt-4">
        <ExploreGrid videos={videos} isLoading={isLoading} />
      </div>

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
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
            onClick={() => setPage((p) => p + 1)}
          >
            {t('next')}
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}

      {searchOpen && <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />}
    </div>
  )
}
