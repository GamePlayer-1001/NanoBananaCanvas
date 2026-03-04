/**
 * [INPUT]: 依赖 react 的 useState/useCallback/useEffect
 * [OUTPUT]: 对外提供 useContextMenu hook (菜单状态 + open/close 控制)
 * [POS]: hooks 的画布右键菜单状态管理，被 Canvas 组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useState } from 'react'

/* ─── Types ──────────────────────────────────────────── */

export type ContextMenuType = 'pane' | 'node'

export interface ContextMenuState {
  show: boolean
  x: number
  y: number
  type: ContextMenuType
  nodeId?: string
}

/* ─── Initial State ──────────────────────────────────── */

const INITIAL_STATE: ContextMenuState = {
  show: false,
  x: 0,
  y: 0,
  type: 'pane',
}

/* ─── Hook ───────────────────────────────────────────── */

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>(INITIAL_STATE)

  const openPaneMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setMenu({ show: true, x: event.clientX, y: event.clientY, type: 'pane' })
  }, [])

  const openNodeMenu = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.preventDefault()
    setMenu({ show: true, x: event.clientX, y: event.clientY, type: 'node', nodeId })
  }, [])

  const close = useCallback(() => {
    setMenu(INITIAL_STATE)
  }, [])

  /* ── Escape 键关闭 ──────────────────────────────────── */
  useEffect(() => {
    if (!menu.show) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menu.show, close])

  return { menu, openPaneMenu, openNodeMenu, close }
}
