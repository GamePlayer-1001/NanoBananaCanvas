/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 next-intl/server 的 setRequestLocale
 * [OUTPUT]: 对外提供工作空间列表页面占位
 * [POS]: (app) 路由组的创作空间首页，SSR 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <WorkspaceContent />
}

function WorkspaceContent() {
  const t = useTranslations('workspace')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
    </div>
  )
}
