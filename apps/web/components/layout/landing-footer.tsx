/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/components/shared/brand-mark，
 *          依赖 @/i18n/navigation 的 Link，依赖 lucide-react 的 Disc3/Instagram/MessageCircle/Send
 * [OUTPUT]: 对外提供 LandingFooter 公开页脚组件
 * [POS]: components/layout 的 Landing 页脚，被 (landing)/page.tsx 消费，负责真实公开链接与社媒出口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { Disc3, Instagram, MessageCircle, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/shared/brand-mark'
import { Link } from '@/i18n/navigation'

function FooterLink({
  href,
  label,
  external = false,
}: {
  href: string
  label: string
  external?: boolean
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-ink)]"
      >
        {label}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-ink)]"
    >
      {label}
    </Link>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ href: string; label: string; external?: boolean }>
}) {
  return (
    <div className="min-w-[148px]">
      <h3 className="mb-4 text-[11px] tracking-[0.28em] text-[var(--landing-faint)] uppercase">
        {title}
      </h3>
      <div className="space-y-3">
        {links.map((link) => (
          <FooterLink key={link.label} href={link.href} label={link.label} external={link.external} />
        ))}
      </div>
    </div>
  )
}

export function LandingFooter() {
  const t = useTranslations('landing.footer')

  const columns = [
    {
      title: t('product'),
      links: [
        { label: t('features'), href: '/features' },
        { label: t('models'), href: '/models' },
        { label: t('pricing'), href: '/pricing' },
      ],
    },
    {
      title: t('resources'),
      links: [
        { label: t('docs'), href: '/docs' },
        { label: t('community'), href: '/explore' },
        { label: t('contact'), href: '/contact' },
      ],
    },
    {
      title: t('company'),
      links: [
        { label: t('about'), href: '/about' },
        { label: t('workspace'), href: '/workspace' },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('terms'), href: '/terms' },
        { label: t('privacy'), href: '/privacy' },
      ],
    },
  ]

  const socialLinks = [
    { icon: Send, href: 'https://t.me/nanobananacanvas', label: 'Telegram' },
    { icon: MessageCircle, href: 'https://discord.gg/nanobananacanvas', label: 'Discord' },
    { icon: Disc3, href: 'https://x.com/nanobananacanvas', label: 'X' },
    { icon: Instagram, href: 'https://instagram.com/nanobananacanvas', label: 'Instagram' },
  ]

  return (
    <footer className="border-t border-white/6 bg-[var(--landing-bg)] px-5 py-14 md:py-18">
      <div className="mx-auto max-w-[1480px]">
        <div className="flex flex-col gap-12 xl:flex-row xl:justify-between">
          <div className="max-w-[28rem]">
            <BrandMark className="text-3xl text-[var(--landing-ink)] md:text-4xl" />
            <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">{t('tagline')}</p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--landing-ink)] transition-colors hover:bg-white/[0.08]"
                >
                  <item.icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
            {columns.map((column) => (
              <FooterColumn key={column.title} title={column.title} links={column.links} />
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/6 pt-6 text-xs text-[var(--landing-faint)] md:flex-row md:items-center md:justify-between">
          <p>{t('copyright')}</p>
          <p>{t('builtFor')}</p>
        </div>
      </div>
    </footer>
  )
}
