/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，依赖 @/components/legal/terms-content
 * [OUTPUT]: 对外提供 TermsPage 服务条款页 (SSG)
 * [POS]: (landing) 路由组的法律页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { TermsContent } from '@/components/legal/terms-content'

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <TermsContent />
}
