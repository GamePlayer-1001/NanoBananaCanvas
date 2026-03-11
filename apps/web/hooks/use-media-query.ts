/**
 * [INPUT]: 依赖 react 的 useState/useEffect
 * [OUTPUT]: 对外提供 useMediaQuery hook (响应式媒体查询)
 * [POS]: hooks 的响应式工具，被布局组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** 桌面端: >= 1024px */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}
