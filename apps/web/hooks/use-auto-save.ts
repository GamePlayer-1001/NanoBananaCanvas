/**
 * [INPUT]: 依赖 @/stores/use-flow-store 的节点/边/视口状态，
 *          依赖 @/services/storage/local-storage 的持久化能力
 * [OUTPUT]: 对外提供 useAutoSave hook (防抖自动保存 + 页面加载恢复)
 * [POS]: hooks 的持久化桥梁，在画布页面挂载时激活
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef } from 'react'
import { useFlowStore } from '@/stores/use-flow-store'
import { loadFromLocal, saveToLocal } from '@/services/storage/local-storage'

const DEBOUNCE_MS = 1000

/* ─── Hook ───────────────────────────────────────────── */

export function useAutoSave() {
  const hasLoaded = useRef(false)

  /* ── 页面加载时恢复 ────────────────────────────── */
  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true

    const saved = loadFromLocal()
    if (saved && saved.nodes.length > 0) {
      useFlowStore.getState().setFlow(saved.nodes, saved.edges, saved.viewport)
    }
  }, [])

  /* ── 防抖自动保存 (subscribe 模式) ─────────────── */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = useFlowStore.subscribe((state, prev) => {
      // 只在 nodes/edges/viewport 变化时保存
      if (state.nodes === prev.nodes && state.edges === prev.edges && state.viewport === prev.viewport) {
        return
      }

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        saveToLocal(state.nodes, state.edges, state.viewport)
      }, DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])
}
