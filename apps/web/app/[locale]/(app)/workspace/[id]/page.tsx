/**
 * [INPUT]: 依赖 next/navigation 的 redirect，依赖 @/lib/seo 的 NO_INDEX_METADATA
 * [OUTPUT]: 对外提供 noindex 的旧画布重定向页
 * [POS]: 兼容性重定向，防止已有链接 /workspace/[id] 404，同时明确它不应进入搜索索引
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata: Metadata = NO_INDEX_METADATA

/* ─── Redirect ───────────────────────────────────────── */

export default async function LegacyCanvasRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  redirect(`/${locale}/canvas/${id}`)
}
