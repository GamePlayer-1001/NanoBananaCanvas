/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，依赖 react 的 Suspense，
 *          依赖 @/components/workspace/workspace-content
 * [OUTPUT]: 对外提供工作区页面
 * [POS]: (app) 路由组的创作空间首页，项目网格管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'

import { WorkspaceContent } from '@/components/workspace/workspace-content'
import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata: Metadata = NO_INDEX_METADATA

/* ─── Page ───────────────────────────────────────────── */

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense>
      <WorkspaceContent />
    </Suspense>
  )
}
