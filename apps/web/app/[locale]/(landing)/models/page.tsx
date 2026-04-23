/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 next 的 Metadata，
 *          依赖 @/components/landing/public-resource-page，依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 /models 公开总览页
 * [POS]: (landing) 路由组的模型生态页，被公开导航与 sitemap 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PublicResourcePage } from '@/components/landing/public-resource-page'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing.publicPages.models' })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/models',
    locale,
  })
}

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing.publicPages.models' })

  setRequestLocale(locale)

  return (
    <PublicResourcePage
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      highlights={[t('highlight1'), t('highlight2'), t('highlight3')]}
      primaryLabel={t('primaryCta')}
      primaryHref="/pricing"
      secondaryLabel={t('secondaryCta')}
      secondaryHref="/docs"
    />
  )
}
