/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale/getTranslations
 * [OUTPUT]: 对外提供 Elements 元素库页面 (占位) + SEO metadata
 * [POS]: (app) 路由组的元素页，后续迭代实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

const BASE_URL = 'https://nanobananacanvas.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('elementsTitle'),
    description: t('elementsDescription'),
    alternates: {
      canonical: `${BASE_URL}/${locale}/elements`,
      languages: { en: `${BASE_URL}/en/elements`, zh: `${BASE_URL}/zh/elements` },
    },
    openGraph: {
      title: `${t('elementsTitle')} | Nano Banana Canvas`,
      description: t('elementsDescription'),
      url: `${BASE_URL}/${locale}/elements`,
      siteName: 'Nano Banana Canvas',
      type: 'website',
    },
  }
}

/* ─── Page ───────────────────────────────────────────── */

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
