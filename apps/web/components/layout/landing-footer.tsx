/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/shared/brand-mark
 * [OUTPUT]: 对外提供 LandingFooter 组件
 * [POS]: components/layout 的 Landing 页脚，被 (landing)/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/shared/brand-mark'
import { Link } from '@/i18n/navigation'

/* ─── Footer Column ──────────────────────────────────── */

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="min-w-[150px]">
      <h3 className="mb-4 text-sm font-medium text-white/80">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function LandingFooter() {
  const t = useTranslations('landing.footer')

  const columns = [
    {
      title: t('product'),
      links: [
        { label: t('features'), href: '/#features' },
        { label: t('models'), href: '/#models' },
        { label: t('pricing'), href: '/pricing' },
      ],
    },
    {
      title: t('company'),
      links: [
        { label: t('about'), href: '/contact' },
        { label: t('contactUs'), href: '/contact' },
        { label: t('faq'), href: '/#faq' },
        { label: t('terms'), href: '/terms' },
        { label: t('privacy'), href: '/privacy' },
      ],
    },
    {
      title: t('contact'),
      links: [
        { label: t('creatorCommunity'), href: '/workflows' },
        { label: t('creativePartners'), href: '/contact' },
      ],
    },
  ]

  return (
    <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8 xl:px-10">
      <div className="w-full">
        {/* ── Top Section ────────────────────────── */}
        <div className="flex flex-col gap-12 md:flex-row md:gap-24">
          {/* Brand Column */}
          <div className="min-w-[200px]">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <BrandMark className="text-xl text-white" />
            </div>
            <p className="mb-4 text-sm text-white/40">{t('tagline')}</p>
            <div className="flex flex-wrap gap-3 text-sm text-white/35">
              <Link href="/contact" className="transition-colors hover:text-white/70">
                Telegram
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white/70">
                Discord
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white/70">
                X
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white/70">
                Instagram
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          <div className="flex flex-1 flex-wrap gap-12 md:gap-16">
            {columns.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
        </div>

        {/* ── Bottom Bar ─────────────────────────── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/5 pt-6 md:flex-row">
          <p className="text-xs text-white/30">{t('copyright')}</p>
          <p className="text-xs text-white/30">{t('builtFor')}</p>
        </div>
      </div>
    </footer>
  )
}
