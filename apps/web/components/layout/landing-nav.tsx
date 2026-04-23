/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/locale-switcher，依赖 @/components/shared/brand-mark，
 *          依赖 @/components/ui/button，依赖 @/components/ui/dropdown-menu，
 *          依赖 lucide-react 的 ChevronDown/Menu
 * [OUTPUT]: 对外提供 LandingNav 公开导航栏组件
 * [POS]: components/layout 的 Landing 导航栏，被 (landing)/layout.tsx 消费，负责公开页真实导航入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ChevronDown, Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from '@/i18n/navigation'

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-ink)]">
      {label}
    </Link>
  )
}

export function LandingNav() {
  const t = useTranslations('landing.nav')

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[rgba(3,3,3,0.78)] backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-[1480px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3 text-[var(--landing-ink)]">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <BrandMark className="text-xl md:text-[1.65rem]" />
          </div>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <NavLink href="/#features" label={t('features')} />
          <NavLink href="/#models" label={t('models')} />
          <NavLink href="/pricing" label={t('pricing')} />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-[var(--landing-muted)] outline-none transition-colors hover:text-[var(--landing-ink)]">
              {t('resources')}
              <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-[22px] border-white/10 bg-[#111111] p-2 text-[var(--landing-ink)]"
            >
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/docs">{t('docs')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/explore">{t('community')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/contact">{t('contact')}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LocaleSwitcher />
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/14 bg-white/[0.02] px-5 text-[var(--landing-ink)] hover:bg-white/[0.06]"
          >
            <Link href="/sign-in">{t('signIn')}</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-[var(--landing-ink)] px-5 text-black hover:bg-white"
          >
            <Link href="/sign-in?redirect_url=/workspace">{t('startCreating')}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LocaleSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--landing-ink)]"
                aria-label={t('menu')}
              >
                <Menu className="size-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-[24px] border-white/10 bg-[#111111] p-2 text-[var(--landing-ink)]"
            >
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/#features">{t('features')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/#models">{t('models')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/pricing">{t('pricing')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/docs">{t('docs')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/explore">{t('community')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/contact">{t('contact')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 text-[var(--landing-ink)]">
                <Link href="/sign-in?redirect_url=/workspace">{t('startCreating')}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
