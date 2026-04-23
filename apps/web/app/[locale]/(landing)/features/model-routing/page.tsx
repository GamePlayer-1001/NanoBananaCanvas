/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 next 的 Metadata，
 *          依赖 @/components/landing/public-resource-page，依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 /features/model-routing 公开功能细分页
 * [POS]: features 子树的模型路由说明页，被 sitemap 与功能总览页消费
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
  const t = await getTranslations({
    locale,
    namespace: 'landing.publicPages.modelRouting',
  })

  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/features/model-routing',
    locale,
  })
}

export default async function ModelRoutingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'landing.publicPages.modelRouting',
  })

  setRequestLocale(locale)

  return (
    <PublicResourcePage
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      highlights={[t('highlight1'), t('highlight2'), t('highlight3')]}
      primaryLabel={t('primaryCta')}
      primaryHref="/sign-in?redirect_url=/workspace"
      secondaryLabel={t('secondaryCta')}
      secondaryHref="/models"
    />
  )
}
