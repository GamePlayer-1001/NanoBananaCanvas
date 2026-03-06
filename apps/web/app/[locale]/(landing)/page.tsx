/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/landing/hero-section, cta-section，
 *          依赖 @/components/layout/landing-footer
 * [OUTPUT]: 对外提供 Landing Page 首页
 * [POS]: (landing) 路由组的首页，SSG 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { setRequestLocale } from 'next-intl/server'

import { CtaSection } from '@/components/landing/cta-section'
import { HeroSection } from '@/components/landing/hero-section'
import { LandingFooter } from '@/components/layout/landing-footer'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main>
      <HeroSection />
      <CtaSection />
      <LandingFooter />
    </main>
  )
}
