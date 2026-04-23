/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 ContactContent 四平台联系卡片组件
 * [POS]: contact 的客户端内容组件，被 (landing)/contact/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'

/* ─── Platform SVG Icons ─────────────────────────────── */

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

/* ─── Platform Config ────────────────────────────────── */

const PLATFORMS = [
  {
    key: 'telegram' as const,
    descKey: 'telegramDesc' as const,
    icon: TelegramIcon,
    href: 'https://t.me/nanobananacanvas',
    color: 'hover:border-sky-400/60 hover:bg-white/[0.065]',
    iconColor: 'text-sky-500',
  },
  {
    key: 'discord' as const,
    descKey: 'discordDesc' as const,
    icon: DiscordIcon,
    href: 'https://discord.gg/nanobananacanvas',
    color: 'hover:border-indigo-400/60 hover:bg-white/[0.065]',
    iconColor: 'text-indigo-500',
  },
  {
    key: 'twitter' as const,
    descKey: 'twitterDesc' as const,
    icon: XIcon,
    href: 'https://x.com/nanobananacanvas',
    color: 'hover:border-white/40 hover:bg-white/[0.065]',
    iconColor: 'text-[var(--landing-ink)]',
  },
  {
    key: 'instagram' as const,
    descKey: 'instagramDesc' as const,
    icon: InstagramIcon,
    href: 'https://instagram.com/nanobananacanvas',
    color: 'hover:border-pink-400/60 hover:bg-white/[0.065]',
    iconColor: 'text-pink-500',
  },
]

/* ─── Component ──────────────────────────────────────── */

export function ContactContent() {
  const t = useTranslations('contact')

  return (
    <main className="bg-[var(--landing-bg)] px-5 pt-28 pb-20 text-[var(--landing-ink)] md:pt-32 md:pb-28">
      <div className="mx-auto max-w-[900px]">
        <p className="text-[11px] tracking-[0.32em] text-[var(--landing-muted)] uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
          {t('title')}
        </h1>
        <p className="mt-5 max-w-[680px] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
          {t('subtitle')}
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PLATFORMS.map(({ key, descKey, icon: Icon, href, color, iconColor }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-start gap-4 rounded-lg border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 transition-colors ${color}`}
            >
              <div className={`mt-0.5 ${iconColor}`}>
                <Icon className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--landing-ink)]">
                    {t(key)}
                  </span>
                  <ExternalLink
                    size={12}
                    className="text-[var(--landing-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <p className="mt-1 text-xs leading-6 text-[var(--landing-muted)]">
                  {t(descKey)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
