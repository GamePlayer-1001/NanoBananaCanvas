/**
 * [INPUT]: 依赖 zustand 的 create
 * [OUTPUT]: 对外提供 useWorkspaceStore (视图模式/排序/搜索)
 * [POS]: stores 的工作区 UI 状态，被 workspace 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'

/* ─── Types ──────────────────────────────────────────── */

type ViewMode = 'grid' | 'list'
type SortBy = 'updatedAt' | 'name' | 'createdAt'

interface WorkspaceState {
  viewMode: ViewMode
  sortBy: SortBy
  searchQuery: string
  setViewMode: (mode: ViewMode) => void
  setSortBy: (sort: SortBy) => void
  setSearchQuery: (query: string) => void
}

/* ─── Store ──────────────────────────────────────────── */

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  viewMode: 'grid',
  sortBy: 'updatedAt',
  searchQuery: '',
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
