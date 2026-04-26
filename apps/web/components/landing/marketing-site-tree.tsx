/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 的 ArrowRight，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 MarketingSiteTree 公开子页面树导航组件
 * [POS]: components/landing 的公开站点树导航层，被公开 SEO 子页面与法务页复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

type SiteTreeItem = {
  key: string
  href: string
}

type SiteTreeGroup = {
  key: string
  items: SiteTreeItem[]
}

const SITE_TREE_GROUPS: SiteTreeGroup[] = [
  {
    key: 'product',
    items: [
      { key: 'features', href: '/features' },
      { key: 'models', href: '/models' },
      { key: 'pricing', href: '/pricing' },
    ],
  },
  {
    key: 'resources',
    items: [
      { key: 'docs', href: '/docs' },
      { key: 'community', href: '/community' },
      { key: 'contact', href: '/contact' },
    ],
  },
  {
    key: 'companyLegal',
    items: [
      { key: 'about', href: '/about' },
      { key: 'terms', href: '/terms' },
      { key: 'privacy', href: '/privacy' },
      { key: 'refundPolicy', href: '/refund-policy' },
      { key: 'acceptableUse', href: '/acceptable-use' },
      { key: 'cookies', href: '/cookies' },
    ],
  },
]

export function MarketingSiteTree({ activeHref }: { activeHref?: string }) {
  const t = useTranslations('sitePages.siteTree')

  return (
    <section className="mt-20 border-t border-white/10 pt-12">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <p className="text-sm font-medium tracking-[0.24em] text-white/42 uppercase">
            {t('eyebrow')}
          </p>
          <h2 className="mt-4 max-w-[12ch] text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-5 max-w-[34rem] text-base leading-8 text-white/60">
            {t('body')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {SITE_TREE_GROUPS.map((group) => (
            <div
              key={group.key}
              className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4"
            >
              <p className="px-2 text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
                {t(`groups.${group.key}.title`)}
              </p>
              <div className="mt-4 space-y-2">
                {group.items.map((item) => {
                  const isActive = item.href === activeHref

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        isActive
                          ? 'group flex min-h-[5.25rem] items-start gap-3 rounded-[18px] border border-white/16 bg-white/10 px-4 py-3 text-white'
                          : 'group flex min-h-[5.25rem] items-start gap-3 rounded-[18px] border border-transparent px-4 py-3 text-white/70 transition hover:border-white/10 hover:bg-white/6 hover:text-white'
                      }
                    >
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5">
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {t(`items.${item.key}.title`)}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-white/48">
                          {t(`items.${item.key}.body`)}
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
