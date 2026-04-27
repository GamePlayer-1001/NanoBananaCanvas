/**
 * [INPUT]: 依赖 lib/seo 的 NO_INDEX_METADATA
 * [OUTPUT]: 对外提供全局 404 页面与 noindex metadata
 * [POS]: App Router 的全局 not-found 处理，阻止无效 URL 被搜索引擎收录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata = NO_INDEX_METADATA

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground mt-4 text-lg">Page not found</p>
    </div>
  )
}
