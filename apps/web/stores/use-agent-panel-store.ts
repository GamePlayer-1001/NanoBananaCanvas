/**
 * [INPUT]: 依赖 zustand 的 create / persist 中间件
 * [OUTPUT]: 对外提供 useAgentPanelStore，承载 Agent 面板的展示模式/折叠/右侧固定宽度，
 *          供 AgentPanel、CanvasControls、Canvas (MiniMap/Controls 偏移) 共同消费
 * [POS]: stores 的 Agent 面板 UI 真相源，避免 panel 与画布工具栏各自读 localStorage 导致状态漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AgentPanelMode = 'floating' | 'docked'

export const AGENT_PANEL_DOCKED_DEFAULT_WIDTH = 420
export const AGENT_PANEL_DOCKED_MIN_WIDTH = 360
export const AGENT_PANEL_DOCKED_MAX_WIDTH = 560

interface AgentPanelState {
  mode: AgentPanelMode
  isOpen: boolean
  dockedWidth: number
  setMode: (mode: AgentPanelMode) => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setDockedWidth: (width: number) => void
}

export const useAgentPanelStore = create<AgentPanelState>()(
  persist(
    (set) => ({
      mode: 'floating',
      isOpen: true,
      dockedWidth: AGENT_PANEL_DOCKED_DEFAULT_WIDTH,
      setMode: (mode) => set({ mode }),
      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setDockedWidth: (width) =>
        set({
          dockedWidth: Math.min(
            AGENT_PANEL_DOCKED_MAX_WIDTH,
            Math.max(AGENT_PANEL_DOCKED_MIN_WIDTH, width),
          ),
        }),
    }),
    {
      name: 'nbc:agent-panel',
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : window.localStorage,
      ),
      partialize: (state) => ({
        mode: state.mode,
        isOpen: state.isOpen,
        dockedWidth: state.dockedWidth,
      }),
    },
  ),
)
