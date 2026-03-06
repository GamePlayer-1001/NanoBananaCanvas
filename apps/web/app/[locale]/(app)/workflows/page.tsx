/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/workflows/workflows-content
 * [OUTPUT]: 对外提供 Workflows 工作流分享页面
 * [POS]: (app) 路由组的工作流页，展示社区分享的工作流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { WorkflowsContent } from '@/components/workflows/workflows-content'

/* ─── Page ───────────────────────────────────────────── */

export default async function WorkflowsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <WorkflowsContent />
}
