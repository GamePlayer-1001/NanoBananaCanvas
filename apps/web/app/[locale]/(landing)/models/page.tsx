/**
 * [INPUT]: 依赖 next/navigation 的 redirect，依赖 @/lib/seo 的 buildLocalizedPath
 * [OUTPUT]: 对外提供 `/models` 兼容重定向页
 * [POS]: (landing) 路由组的历史模型详情路由壳层；真实详情内容已下线，旧链接统一回落到首页 `#models` 锚点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { redirect } from 'next/navigation'

import { buildLocalizedPath } from '@/lib/seo'

export default async function ModelsPageRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`${buildLocalizedPath('/', locale)}#models`)
}
