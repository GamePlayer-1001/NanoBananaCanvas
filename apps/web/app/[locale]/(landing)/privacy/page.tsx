/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，依赖 @/components/legal/privacy-content
 * [OUTPUT]: 对外提供 PrivacyPage 隐私政策页 (SSG)
 * [POS]: (landing) 路由组的法律页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { PrivacyContent } from '@/components/legal/privacy-content'

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <PrivacyContent />
}
