/**
 * [INPUT]: 依赖 next/navigation 的 redirect
 * [OUTPUT]: 重定向旧画布路由到新全屏画布
 * [POS]: 兼容性重定向，防止已有链接 /workspace/[id] 404
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { redirect } from 'next/navigation'

/* ─── Redirect ───────────────────────────────────────── */

export default async function LegacyCanvasRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  redirect(`/${locale}/canvas/${id}`)
}
