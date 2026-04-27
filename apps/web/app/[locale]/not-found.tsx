/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations，依赖 lib/seo 的 NO_INDEX_METADATA
 * [OUTPUT]: 对外提供 locale 感知的 404 页面与 noindex metadata
 * [POS]: [locale] 路由段内的本地化 not-found 处理，覆盖全局英文兜底并阻止无效 locale URL 收录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getTranslations } from 'next-intl/server'
import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata = NO_INDEX_METADATA

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground mt-4 text-lg">{t('description')}</p>
    </div>
  )
}
