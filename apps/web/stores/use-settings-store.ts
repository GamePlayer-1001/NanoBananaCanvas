/**
 * [INPUT]: 依赖 zustand 的 create，依赖 zustand/middleware 的 persist
 * [OUTPUT]: 对外提供 useSettingsStore (主题/语言/侧边栏/API Key 偏好)
 * [POS]: stores 的全局设置状态，被 layout/settings/api-key-dialog 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ─── Types ──────────────────────────────────────────── */

type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  /* ── Data ─────────────────────────────────────────── */
  theme: Theme
  sidebarCollapsed: boolean
  apiKey: string

  /* ── Actions ──────────────────────────────────────── */
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setApiKey: (key: string) => void
}

/* ─── Store ──────────────────────────────────────────── */

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      apiKey: '',

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'nb-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        apiKey: state.apiKey,
      }),
    },
  ),
)
