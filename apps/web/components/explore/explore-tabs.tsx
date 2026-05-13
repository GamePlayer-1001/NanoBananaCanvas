/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ExploreTabs 顶部工具条（主类型 Tab + 二级分类 Tab + 排序下拉）
 * [POS]: explore 的顶部工具区，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

/* ─── Tab Config ─────────────────────────────────────── */

const SORT_TABS = ['hot', 'latest', 'myLiked'] as const
const TYPE_TABS = ['image', 'video', 'workflow'] as const

const SUBCATEGORY_TABS = {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTypeChange(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeType === tab
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {t(`type_${tab}`)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-500">
          <span>{t('sortLabel')}</span>
          <select
            value={activeSort}
            onChange={(event) => onSortChange(event.target.value as ExploreTab)}
            className="h-10 rounded-full border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition-colors hover:border-stone-300 focus:border-stone-400"
          >
            {SORT_TABS.map((tab) => (
              <option key={tab} value={tab}>
                {t(tab)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {subcategories.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSubcategoryChange(tab)}
            className={`rounded-full border px-4 py-2 text-sm transition-all ${
              activeSubcategory === tab
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            {t(`subcategory_${tab}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
