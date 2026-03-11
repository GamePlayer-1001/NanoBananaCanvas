/**
 * [INPUT]: 依赖 zustand 的 create，依赖 @xyflow/react 的 Node/Edge 类型
 * [OUTPUT]: 对外提供 useHistoryStore (画布撤销/重做状态快照栈)
 * [POS]: stores 的历史管理，被 useFlowStore 写入快照，被 useCanvasShortcuts 触发 undo/redo
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import { create } from 'zustand'

import type { WorkflowNodeData } from '@/types'
import { createLogger } from '@/lib/logger'

const log = createLogger('HistoryStore')

/* ─── Types ──────────────────────────────────────────── */

export interface Snapshot {
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
}

interface HistoryState {
  past: Snapshot[]
  future: Snapshot[]
  canUndo: boolean
  canRedo: boolean

  /** 记录当前状态快照 (操作发生前调用) */
  push: (snapshot: Snapshot) => void
  /** 撤销：past 栈顶 → present, present → future */
  undo: () => Snapshot | null
  /** 重做：future 栈顶 → present, present → past */
  redo: () => Snapshot | null
  /** 清空历史 */
  clear: () => void
}

/* ─── Constants ──────────────────────────────────────── */

const MAX_HISTORY = 50

/* ─── Store ──────────────────────────────────────────── */

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  push: (snapshot) => {
    const { past } = get()
    const trimmed = past.length >= MAX_HISTORY ? past.slice(1) : past
    set({
      past: [...trimmed, snapshot],
      future: [],
      canUndo: true,
      canRedo: false,
    })
  },

  undo: () => {
    const { past } = get()
    if (past.length === 0) return null

    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)

    log.debug('Undo', { remaining: newPast.length })
    set({
      past: newPast,
      canUndo: newPast.length > 0,
      canRedo: true,
    })

    return previous
  },

  redo: () => {
    const { future } = get()
    if (future.length === 0) return null

    const next = future[future.length - 1]
    const newFuture = future.slice(0, -1)

    log.debug('Redo', { remaining: newFuture.length })
    set({
      future: newFuture,
      canRedo: newFuture.length > 0,
      canUndo: true,
    })

    return next
  },

  clear: () => {
    set({ past: [], future: [], canUndo: false, canRedo: false })
  },
}))

/* ─── Debounced Push (用于拖拽等高频操作) ──────────────── */

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 防抖记录快照 — 拖拽移动节点时 200ms 合并，避免每帧入栈
 */
export function debouncedPush(snapshot: Snapshot, delayMs = 200) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    useHistoryStore.getState().push(snapshot)
    debounceTimer = null
  }, delayMs)
}
