/**
 * [INPUT]: 依赖 @clerk/nextjs 的 Show，依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/locale-switcher，
 *          依赖 lucide-react 的 ChevronDown
 * [OUTPUT]: 对外提供 LandingNav 导航栏组件
 * [POS]: components/layout 的 Landing 导航栏，被 (landing)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Link } from '@/i18n/navigation'

/* ─── Component ──────────────────────────────────────── */

export function LandingNav() {
  const t = useTranslations('landing')

  return (
    <TooltipProvider>
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          {/* ── Logo ───────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">🎨</span>
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Nano Banana Canvas
            </Link>
          </div>

          {/* ── Center Nav Links ────────────────────────── */}
          <div className="hidden items-center gap-8 md:flex">
            <button className="flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white">
              {t('nav.features')}
              <ChevronDown className="h-4 w-4" />
            </button>
            <Link href="/" className="text-sm text-white/70 transition-colors hover:text-white">
              {t('nav.enterprise')}
            </Link>
            <Link href="/" className="text-sm text-white/70 transition-colors hover:text-white">
              {t('nav.pricing')}
            </Link>
            <button className="flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white">
              {t('nav.resources')}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* ── Right Actions ──────────────────────────── */}
          <div className="flex items-center gap-3">
            <LocaleSwitcher />

            <Show when="signed-out">
              <SignInButton>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 text-sm text-white hover:bg-white/10"
                >
                  {t('nav.startCreating')}
                </Button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <Link href="/workspace">
                <Button
                  size="sm"
                  className="bg-brand-500 hover:bg-brand-600 text-sm text-white"
                >
                  {t('nav.startCreating')}
                </Button>
              </Link>
              <UserButton
                appearance={{ elements: { avatarBox: 'w-8 h-8' } }}
              />
            </Show>
          </div>
        </nav>
      </header>
    </TooltipProvider>
  )
}
