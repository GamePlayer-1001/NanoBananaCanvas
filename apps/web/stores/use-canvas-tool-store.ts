/**
 * [INPUT]: 依赖 zustand 的 create
 * [OUTPUT]: 对外提供 useCanvasToolStore (activeTool 状态 + setActiveTool/resetTool 操作)
 * [POS]: stores 的画布工具状态，被 CanvasToolbar 和 Canvas 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'

/* ─── Types ───────────────────────────────────────────── */

export type CanvasTool = 'select' | 'hand' | 'text-input' | 'llm' | 'display' | 'image-gen' | 'video-gen'

interface CanvasToolState {
  activeTool: CanvasTool
  setActiveTool: (tool: CanvasTool) => void
  resetTool: () => void
}

/* ─── Store ───────────────────────────────────────────── */

export const useCanvasToolStore = create<CanvasToolState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  resetTool: () => set({ activeTool: 'select' }),
}))
