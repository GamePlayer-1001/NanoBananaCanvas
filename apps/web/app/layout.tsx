/**
 * [INPUT]: 无外部依赖 (html/body 委托给 [locale]/layout.tsx)
 * [OUTPUT]: 对外提供应用根布局（透传容器 + fallback metadata）
 * [POS]: App Router 的最顶层布局，将渲染职责委托给 [locale]/layout.tsx
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
