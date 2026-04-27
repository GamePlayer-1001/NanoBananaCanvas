/**
 * [INPUT]: 依赖 @/lib/seo 的 NO_INDEX_METADATA
 * [OUTPUT]: 对外提供画布详情 SEO 布局，为编辑器详情页输出 noindex
 * [POS]: (editor)/canvas/[id] 路由的服务端 SEO 壳层，不介入编辑器客户端逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'

import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata: Metadata = NO_INDEX_METADATA

export default function CanvasSeoLayout({ children }: { children: React.ReactNode }) {
  return children
}
