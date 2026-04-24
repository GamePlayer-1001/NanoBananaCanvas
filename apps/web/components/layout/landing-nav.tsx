/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 的 ChevronDown/ArrowRight，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/locale-switcher，
 *          依赖 @/components/shared/brand-mark
 * [OUTPUT]: 对外提供 LandingNav 导航栏组件
 * [POS]: components/layout 的 Landing 导航栏，被 (landing)/layout.tsx 消费，保持公开页无 Clerk 依赖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

/* ─── Component ──────────────────────────────────────── */

export function LandingNav() {
  const t = useTranslations('landing')
  const resourceLinks = ['docs', 'community', 'contact'].map((key) => ({
    title: t(`nav.resourcesItems.${key}.title`),
    body: t(`nav.resourcesItems.${key}.body`),
    href: key === 'docs' ? '/docs' : key === 'community' ? '/community' : '/contact',
  }))

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/28 backdrop-blur-md">
      <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
        <Link href="/" className="text-white">
          <BrandMark withLogo className="text-xl text-white md:text-[1.4rem]" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/models" className="text-sm text-white/70 transition-colors hover:text-white">
            {t('nav.models')}
          </Link>
          <Link
            href="/features"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            {t('nav.features')}
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            {t('nav.pricing')}
          </Link>
          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <span>{t('nav.resources')}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="invisible absolute top-full right-0 mt-3 w-[320px] translate-y-2 rounded-[26px] border border-white/10 bg-[#0b0c10]/98 p-3 opacity-0 shadow-[0_24px_80px_rgba(0,0,0,0.36)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {resourceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 rounded-[20px] px-4 py-3 transition hover:bg-white/6"
                >
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/54">{item.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/sign-in">
            <Button size="sm" className="bg-white text-sm text-black hover:bg-white/88">
              {t('nav.startCreating')}
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}
