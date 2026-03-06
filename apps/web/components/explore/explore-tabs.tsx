/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 的 Upload 图标
 * [OUTPUT]: 对外提供 ExploreTabs 标签栏组件 (热门/最新/我点赞的/我的视频)
 * [POS]: explore 的顶部标签导航，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Upload } from 'lucide-react'

/* ─── Tab Config ─────────────────────────────────────── */

const TABS = ['hot', 'latest', 'myLiked', 'myVideos'] as const

export type ExploreTab = (typeof TABS)[number]

/* ─── Component ──────────────────────────────────────── */

export function ExploreTabs({
  active,
  onChange,
}: {
  active: ExploreTab
  onChange: (tab: ExploreTab) => void
}) {
  const t = useTranslations('explore')

  return (
    <div className="flex items-center justify-between">
      {/* 标签 */}
      <div className="flex gap-1">
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

      {/* 上传按钮 */}
      <button className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600">
        <Upload size={14} />
        {t('uploadVideo')}
      </button>
    </div>
  )
}
