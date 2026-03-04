/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignInButton / SignUpButton / UserButton / Show，
 *          依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/locale-switcher 的 LocaleSwitcher
 * [OUTPUT]: 对外提供 LandingNav 导航栏组件
 * [POS]: components/layout 的 Landing 导航栏，被 (landing)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LocaleSwitcher } from '@/components/locale-switcher'

/* ─── Component ──────────────────────────────────────── */

export function LandingNav() {
  const t = useTranslations('landing')

  return (
    <TooltipProvider>
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* ── Logo ───────────────────────────────────── */}
        <Link href="/" className="text-lg font-bold text-white">
          Nano Banana Canvas
        </Link>

        {/* ── Actions ────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          <Show when="signed-out">
            <SignInButton>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                {t('signIn')}
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white">
                {t('cta')}
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/workspace">
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white">
                {t('dashboard')}
              </Button>
            </Link>
            <UserButton
              appearance={{
                elements: { avatarBox: 'w-8 h-8' },
              }}
            />
          </Show>
        </div>
      </nav>
    </header>
    </TooltipProvider>
  )
}
