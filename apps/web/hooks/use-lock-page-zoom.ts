/**
 * [INPUT]: 依赖 react 的 useEffect，无外部状态依赖
 * [OUTPUT]: 对外提供 useLockPageZoom hook (在 capture 阶段拦截 Ctrl+加/减/0、Ctrl+滚轮、触摸板捏合，阻止浏览器整页缩放)
 * [POS]: hooks 的桌面端整页缩放锁死桥梁，在画板编辑器布局中激活，避免画板组件随浏览器整页缩放畸变
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect } from 'react'

/* ─── Hook ───────────────────────────────────────────── */

export function useLockPageZoom(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const isZoomKey = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey
      if (!ctrl) return false
      if (event.key === '+' || event.key === '-' || event.key === '=' || event.key === '0') {
        return true
      }
      const code = event.code
      return (
        code === 'Equal' ||
        code === 'Minus' ||
        code === 'NumpadAdd' ||
        code === 'NumpadSubtract' ||
        code === 'Digit0' ||
        code === 'Numpad0'
      )
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isZoomKey(event)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
      }
    }

    const onGesture = (event: Event) => {
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    window.addEventListener('gesturestart', onGesture, { passive: false })
    window.addEventListener('gesturechange', onGesture, { passive: false })
    window.addEventListener('gestureend', onGesture, { passive: false })

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true } as EventListenerOptions)
      window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions)
      window.removeEventListener('gesturestart', onGesture)
      window.removeEventListener('gesturechange', onGesture)
      window.removeEventListener('gestureend', onGesture)
    }
  }, [enabled])
}
