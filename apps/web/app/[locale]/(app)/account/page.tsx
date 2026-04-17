/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，依赖 @/components/profile/account-content
 * [OUTPUT]: 对外提供账户页面
 * [POS]: (app) 路由组的账户页，承载个人资料/作品/通知/API 接入配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { AccountContent } from '@/components/profile/account-content'

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AccountContent />
}
