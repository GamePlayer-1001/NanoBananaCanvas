/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 @/components/legal/terms-content，
 *          依赖 @/components/landing/marketing-site-tree，依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 TermsPage 服务条款页 (SSG) + SEO metadata
 * [POS]: (landing) 路由组的法律页面，承接公开服务条款与计费边界说明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import { TermsContent } from '@/components/legal/terms-content'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return buildPageMetadata({
    title: t('termsTitle'),
    description: t('termsDescription'),
    path: '/terms',
    locale,
  })
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <TermsContent />
      <div className="bg-[#09090d] px-4 pb-24 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1380px]">
          <MarketingSiteTree activeHref="/terms" />
        </div>
      </div>
    </>
  )
}
