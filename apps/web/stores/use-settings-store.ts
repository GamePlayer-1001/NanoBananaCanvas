/**
 * [INPUT]: 依赖 zustand 的 create，依赖 zustand/middleware 的 persist，
 *          依赖 @/services/storage/crypto 的加密存储
 * [OUTPUT]: 对外提供 useSettingsStore (主题/语言/侧边栏/API Key 偏好)
 * [POS]: stores 的全局设置状态，被 layout/settings/api-key-dialog 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  encryptAndStoreApiKey,
  loadAndDecryptApiKey,
} from '@/services/storage/crypto'

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
      setApiKey: (key) => {
        set({ apiKey: key })
        encryptAndStoreApiKey(key)
      },
    }),
    {
      name: 'nb-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        // apiKey 不再明文持久化，由 crypto.ts 加密存储
      }),
    },
  ),
)

/* ─── Hydrate API Key from encrypted storage ─────────── */

if (typeof window !== 'undefined') {
  // 迁移：清除旧版明文 apiKey
  try {
    const raw = localStorage.getItem('nb-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state?.apiKey) {
        // 若加密存储为空，先迁移旧明文 key 到加密存储
        if (!localStorage.getItem('nb-api-key-enc')) {
          encryptAndStoreApiKey(parsed.state.apiKey)
        }
        delete parsed.state.apiKey
        localStorage.setItem('nb-settings', JSON.stringify(parsed))
      }
    }
  } catch {
    // 忽略解析错误
  }

  // 从加密存储加载 API Key 到运行时
  loadAndDecryptApiKey().then((key) => {
    if (key) useSettingsStore.setState({ apiKey: key })
  })
}
