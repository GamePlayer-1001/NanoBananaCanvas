/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，依赖 @/components/locale-switcher，
 *          依赖 @/components/shared/brand-mark，依赖 @/components/layout/global-promo-bar 的 GlobalPromoBar
 * [OUTPUT]: 对外提供 LandingNav 导航栏组件（含顶部推广气泡 GlobalPromoBar）
 * [POS]: components/layout 的 Landing 导航栏，被 (landing)/layout.tsx 消费；公开导航已收口为首页锚点 + 登录入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { GlobalPromoBar } from '@/components/layout/global-promo-bar'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

/* ─── Component ──────────────────────────────────────── */

export function LandingNav() {
  const t = useTranslations('landing')

  return (
    <header className="fixed top-0 right-0 left-0 z-50">
      <GlobalPromoBar />
      <div className="border-b border-white/10 bg-black/28 backdrop-blur-md">
      <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
        <Link href="/" className="text-white">
          <BrandMark withLogo className="text-xl text-white md:text-[1.4rem]" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="inline-flex min-h-11 items-center text-sm text-white/82 transition-colors hover:text-white"
          >
            {t('nav.features')}
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex min-h-11 items-center text-sm text-white/82 transition-colors hover:text-white"
          >
            {t('nav.pricing')}
          </Link>
          <Link
            href="/#models"
            className="inline-flex min-h-11 items-center text-sm text-white/82 transition-colors hover:text-white"
          >
            {t('nav.models')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/sign-in">
            <Button size="sm" className="min-h-11 bg-white px-4 text-sm text-black hover:bg-white/88">
              {t('nav.startCreating')}
            </Button>
          </Link>
        </div>
      </nav>
      </div>
    </header>
  )
}
