/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/explore/explore-tabs，
 *          依赖 @/components/explore/explore-grid，
 *          依赖 @/hooks/use-explore 的 useExplore
 * [OUTPUT]: 对外提供 ExploreContent 客户端交互容器
 * [POS]: explore 的客户端组合组件，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { ExploreTabs, type ExploreTab } from './explore-tabs'
import { ExploreGrid } from './explore-grid'
import { useExplore } from '@/hooks/use-explore'
import { Link } from '@/i18n/navigation'

/* ─── Tab → API Sort Mapping ─────────────────────────── */

const TAB_SORT: Record<ExploreTab, string> = {
  hot: 'hot',
  latest: 'latest',
  myLiked: 'liked',
  myVideos: 'mine',
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreContent() {
  const t = useTranslations('common')
  const [activeTab, setActiveTab] = useState<ExploreTab>('hot')

  const { data, isLoading } = useExplore({ sort: TAB_SORT[activeTab] })

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-5">
      {/* 标签栏 */}
      <ExploreTabs active={activeTab} onChange={setActiveTab} />

      {/* 查看全部 */}
      <div className="mt-4 flex justify-end">
        <Link
          href="/explore"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('viewAll')} →
        </Link>
      </div>

      {/* 视频网格 */}
      <div className="mt-4">
        <ExploreGrid videos={data as never} isLoading={isLoading} />
      </div>
    </div>
  )
}
