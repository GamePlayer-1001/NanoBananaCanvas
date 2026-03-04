/**
 * [INPUT]: 依赖 @tanstack/react-query 的 QueryClientProvider + DevTools
 * [OUTPUT]: 对外提供 QueryProvider 客户端组件
 * [POS]: lib/query 的 React 上下文桥，被 root layout 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { getQueryClient } from './client'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
