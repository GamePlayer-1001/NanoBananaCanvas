/**
 * [INPUT]: 依赖 react 的 useCallback/useSyncExternalStore
 * [OUTPUT]: 对外提供 useMediaQuery hook (响应式媒体查询)
 * [POS]: hooks 的响应式工具，被布局组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** 桌面端: >= 1024px */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

/** 系统 reduced motion 偏好 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
