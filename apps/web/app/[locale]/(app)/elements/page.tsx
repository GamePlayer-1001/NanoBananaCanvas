/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale
 * [OUTPUT]: 对外提供 Elements 元素库页面 (占位)
 * [POS]: (app) 路由组的元素页，后续迭代实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

export default async function ElementsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted-foreground">Elements — Coming Soon</p>
    </div>
  )
}
