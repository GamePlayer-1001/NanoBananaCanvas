/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ExploreTabs 顶部工具条（主类型 Tab + 条件二级分类 + 排序下拉）
 * [POS]: explore 的顶部工具区，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

/* ─── Tab Config ─────────────────────────────────────── */

const SORT_TABS = ['hot', 'latest', 'myLiked'] as const
const TYPE_TABS = ['all', 'image', 'video', 'workflow'] as const

const SUBCATEGORY_TABS = {
  all: ['all'],
  image: ['all', 'photo-real', 'comic', 'visual', 'architecture', 'abstract', 'design'],
  video: ['all', 'photo-real', 'anime', 'visual', 'architecture', 'abstract', 'design'],
  workflow: ['all', 'text-gen', 'image-gen', 'video-gen', 'audio-gen', 'other'],
} as const

export type ExploreTab = (typeof SORT_TABS)[number]
export type ExploreContentTypeTab = (typeof TYPE_TABS)[number]
export type ExploreSubcategoryTab = (typeof SUBCATEGORY_TABS)[ExploreContentTypeTab][number]

/* ─── Component ──────────────────────────────────────── */

export function ExploreTabs({
  activeSort,
  activeType,
  activeSubcategory,
  onSortChange,
  onTypeChange,
  onSubcategoryChange,
}: {
  activeSort: ExploreTab
  activeType: ExploreContentTypeTab
  activeSubcategory: ExploreSubcategoryTab
  onSortChange: (tab: ExploreTab) => void
  onTypeChange: (tab: ExploreContentTypeTab) => void
  onSubcategoryChange: (tab: ExploreSubcategoryTab) => void
}) {
  const t = useTranslations('explore')
  const subcategories = SUBCATEGORY_TABS[activeType]

  return (
    <div className="space-y-4 border-b border-stone-200 pb-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTypeChange(tab)}
              className={`border-b-2 pb-2 text-base font-medium transition-all ${
                activeType === tab
                  ? 'border-[#2d7ef7] text-stone-950'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {t(`type_${tab}`)}
            </button>
          ))}
        </div>

        <label className="flex items-center text-sm text-stone-500">
          <select
            value={activeSort}
            onChange={(event) => onSortChange(event.target.value as ExploreTab)}
            className="h-10 min-w-[116px] rounded-full border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition-colors hover:border-stone-300 focus:border-stone-400"
          >
            {SORT_TABS.map((tab) => (
              <option key={tab} value={tab}>
                {t(tab)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {activeType === 'all' ? null : (
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {subcategories.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onSubcategoryChange(tab)}
              className={`text-sm transition-all ${
                activeSubcategory === tab
                  ? 'font-medium text-stone-950'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {t(`subcategory_${tab}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
