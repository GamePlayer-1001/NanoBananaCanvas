/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，依赖 @/components/legal/privacy-content，
 *          依赖 @/components/landing/marketing-site-tree
 * [OUTPUT]: 对外提供 PrivacyPage 隐私政策页 (SSG)
 * [POS]: (landing) 路由组的法律页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import { PrivacyContent } from '@/components/legal/privacy-content'

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <PrivacyContent />
      <div className="bg-[#09090d] px-4 pb-24 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1380px]">
          <MarketingSiteTree activeHref="/privacy" />
        </div>
      </div>
    </>
  )
}
