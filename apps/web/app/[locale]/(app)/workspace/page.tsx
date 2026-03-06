/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/workspace/workspace-content
 * [OUTPUT]: 对外提供工作区页面
 * [POS]: (app) 路由组的创作空间首页，项目网格管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { WorkspaceContent } from '@/components/workspace/workspace-content'

/* ─── Page ───────────────────────────────────────────── */

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <WorkspaceContent />
}
