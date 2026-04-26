/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/stores/use-workspace-store，
 *          依赖 @/components/ui/dropdown-menu，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorkspaceHeader 组件 (面包屑 + 搜索 + 排序 + 视图切换 + 新建 + 批量管理)
 * [POS]: workspace 的顶部工具栏，被 workspace-content.tsx 消费，负责普通视图与多选管理视图切换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { CheckSquare, FolderInput, LayoutGrid, List, Plus, Search, Trash2, User, X } from 'lucide-react'

import { useWorkspaceStore } from '@/stores/use-workspace-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/* ─── Sort Options ───────────────────────────────────── */

const SORT_OPTIONS = [
  { value: 'updatedAt', labelKey: 'sortRecent' },
  { value: 'name', labelKey: 'sortName' },
  { value: 'createdAt', labelKey: 'sortCreated' },
] as const

/* ─── Component ──────────────────────────────────────── */

export function WorkspaceHeader({
  onNewProject,
  selectionMode,
  selectedCount,
  allVisibleSelected,
  folders,
  isBulkActionPending,
  onToggleSelectionMode,
  onSelectAllVisible,
  onClearSelection,
  onMoveSelected,
  onDeleteSelected,
}: {
  onNewProject: () => void
  selectionMode: boolean
  selectedCount: number
  allVisibleSelected: boolean
  folders: Array<{ id: string; name: string }>
  isBulkActionPending: boolean
  onToggleSelectionMode: () => void
  onSelectAllVisible: () => void
  onClearSelection: () => void
  onMoveSelected: (folderId: string | null) => void
  onDeleteSelected: () => void
}) {
  const t = useTranslations('workspace')
  const ts = useTranslations('sidebar')
  const { viewMode, setViewMode, sortBy, setSortBy, searchQuery, setSearchQuery } =
    useWorkspaceStore()

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <User size={16} className="text-brand-500" />
        <span className="font-medium text-brand-600">{t('personalProjects')}</span>
      </div>

      {/* 右侧工具 */}
      <div className="flex items-center gap-3">
        {selectionMode ? (
          <>
            <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
              {t('selectedCount', { count: selectedCount })}
            </span>

            <Button variant="outline" size="sm" onClick={onSelectAllVisible}>
              <CheckSquare size={14} />
              {allVisibleSelected ? t('clearVisibleSelection') : t('selectAllVisible')}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={selectedCount === 0 || isBulkActionPending}>
                  <FolderInput size={14} />
                  {ts('moveToFolder')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onMoveSelected(null)}>
                  {ts('noFolder')}
                </DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onMoveSelected(folder.id)}
                  >
                    <span className="truncate">{folder.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0 || isBulkActionPending}
            >
              <Trash2 size={14} />
              {t('deleteSelected')}
            </Button>

            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <X size={14} />
              {t('cancelSelection')}
            </Button>
          </>
        ) : (
          <>
            {/* 搜索 */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-[220px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
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

            <Button variant="outline" size="sm" onClick={onToggleSelectionMode}>
              <CheckSquare size={14} />
              {t('manageProjects')}
            </Button>

            {/* 新建项目 */}
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Plus size={14} />
              {t('newProject')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
