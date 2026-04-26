/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 useRouter，
 *          依赖 lucide-react 的 Search/Upload 图标
 * [OUTPUT]: 对外提供 ExploreTabs 标签栏组件 (热门/最新/我点赞的/我的视频 + 探索搜索入口 + 视频分析跳转)
 * [POS]: explore 的顶部标签导航，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Search, Upload } from 'lucide-react'

/* ─── Tab Config ─────────────────────────────────────── */

const TABS = ['hot', 'latest', 'myLiked', 'myVideos'] as const

export type ExploreTab = (typeof TABS)[number]

/* ─── Component ──────────────────────────────────────── */

export function ExploreTabs({
  active,
  onChange,
  onSearchOpen,
  searchLabel,
}: {
  active: ExploreTab
  onChange: (tab: ExploreTab) => void
  onSearchOpen: () => void
  searchLabel: string
}) {
  const t = useTranslations('explore')
  const router = useRouter()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* 标签 */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              active === tab
                ? 'bg-brand-500 font-medium text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSearchOpen}
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors"
        >
          <Search size={14} />
          <span>{searchLabel}</span>
          <kbd className="border-border bg-muted rounded border px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* 上传按钮 */}
        <button
          onClick={() => router.push('/video-analysis')}
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Upload size={14} />
          {t('uploadVideo')}
        </button>
      </div>
    </div>
  )
}
