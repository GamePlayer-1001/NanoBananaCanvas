/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 LandingRail 节点式滚动导航与 LANDING_SECTION_IDS 常量
 * [POS]: landing/sections 的进度导航，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

export const LANDING_SECTION_IDS = [
  'hero',
  'models',
  'features',
  'pricing',
  'proof',
  'faq',
  'cta',
] as const

export type LandingSectionId = (typeof LANDING_SECTION_IDS)[number]

export function LandingRail({
  activeId,
  visible,
}: {
  activeId: string
  visible: boolean
}) {
  const t = useTranslations('landing.sections.rail')

  return (
    <nav
      className={`pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:flex xl:flex-col xl:gap-3 xl:transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-label="Landing sections"
    >
      {LANDING_SECTION_IDS.map((id) => {
        const active = activeId === id

        return (
          <a
            key={id}
            href={`#${id}`}
            className="pointer-events-auto group flex items-center justify-end gap-3"
          >
            <span
              className={`max-w-0 overflow-hidden text-[10px] tracking-[0.26em] whitespace-nowrap uppercase transition-all duration-300 group-hover:max-w-[10rem] ${active ? 'text-[var(--landing-ink)]' : 'text-[var(--landing-faint)]'}`}
            >
              {t(id)}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${active ? 'border-[var(--landing-ink)] bg-[var(--landing-ink)] shadow-[0_0_16px_rgba(255,255,255,0.4)]' : 'border-white/26 bg-transparent'}`}
            />
          </a>
        )
      })}
    </nav>
  )
}
