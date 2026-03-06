/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/stores/use-workspace-store，
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorkspaceHeader 组件 (面包屑 + 搜索 + 排序 + 视图切换 + 新建)
 * [POS]: workspace 的顶部工具栏，被 workspace-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Search, LayoutGrid, List, Plus, User } from 'lucide-react'

import { useWorkspaceStore } from '@/stores/use-workspace-store'

/* ─── Sort Options ───────────────────────────────────── */

const SORT_OPTIONS = [
  { value: 'updatedAt', labelKey: 'sortRecent' },
  { value: 'name', labelKey: 'sortName' },
  { value: 'createdAt', labelKey: 'sortCreated' },
] as const

/* ─── Component ──────────────────────────────────────── */

export function WorkspaceHeader({
  onNewProject,
}: {
  onNewProject: () => void
}) {
  const t = useTranslations('workspace')
  const { viewMode, setViewMode, sortBy, setSortBy, searchQuery, setSearchQuery } =
    useWorkspaceStore()

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortBy)

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <User size={16} className="text-brand-500" />
        <span className="font-medium text-brand-600">{t('personalProjects')}</span>
      </div>

      {/* 右侧工具 */}
      <div className="flex items-center gap-3">
        {/* 搜索 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-[180px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground focus:border-brand-500 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>

        {/* 视图切换 */}
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex h-8 w-8 items-center justify-center transition-colors ${
              viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex h-8 w-8 items-center justify-center border-l border-border transition-colors ${
              viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List size={14} />
          </button>
        </div>

        {/* 新建项目 */}
        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus size={14} />
          {t('newProject')}
        </button>
      </div>
    </div>
  )
}
