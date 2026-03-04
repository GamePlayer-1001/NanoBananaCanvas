/**
 * [INPUT]: 依赖 zustand 的 create
 * [OUTPUT]: 对外提供 useSettingsStore (主题/语言/侧边栏偏好)
 * [POS]: stores 的全局设置状态，被 layout 和 settings 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  theme: Theme
  sidebarCollapsed: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  sidebarCollapsed: false,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
