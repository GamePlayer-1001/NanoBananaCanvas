/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/locale-switcher，
 *          依赖 @/components/shared/brand-mark
 * [OUTPUT]: 对外提供 LandingNav 导航栏组件
 * [POS]: components/layout 的 Landing 导航栏，被 (landing)/layout.tsx 消费，保持公开页无 Clerk 依赖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Link } from '@/i18n/navigation'

/* ─── Component ──────────────────────────────────────── */

export function LandingNav() {
  const t = useTranslations('landing')

  return (
    <TooltipProvider>
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 backdrop-blur-md">
        <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* ── Logo ───────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">🎨</span>
            <Link href="/" className="text-white">
              <BrandMark className="text-xl text-white md:text-[1.4rem]" />
            </Link>
          </div>

          {/* ── Center Nav Links ────────────────────────── */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/#models"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {t('nav.models')}
            </Link>
            <Link
              href="/#features"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {t('nav.features')}
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href="/contact"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {t('nav.resources')}
            </Link>
          </div>

          {/* ── Right Actions ──────────────────────────── */}
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link href="/sign-in">
              <Button
                size="sm"
                className="bg-white text-sm text-black hover:bg-white/88"
              >
                {t('nav.startCreating')}
              </Button>
            </Link>
          </div>
        </nav>
      </header>
    </TooltipProvider>
  )
}
