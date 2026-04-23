/**
 * [INPUT]: 依赖 react 的 ReactNode 类型
 * [OUTPUT]: 对外提供 SectionShell 板块外壳组件
 * [POS]: landing/sections 的满屏背景与布局基础，被各首页内容板块复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ReactNode } from 'react'

export type ContentSectionId = 'models' | 'features' | 'pricing' | 'proof' | 'faq' | 'cta'

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: ContentSectionId
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="landing-snap-section relative overflow-hidden border-t border-white/6 px-5 py-20 md:py-28 lg:scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.075),transparent_24%),radial-gradient(circle_at_84%_72%,rgba(255,255,255,0.055),transparent_28%),linear-gradient(180deg,#050505_0%,#090909_48%,#030303_100%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(247,244,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(247,244,238,0.08)_1px,transparent_1px)] [background-size:96px_96px] opacity-[0.09]" />
        <div className="landing-grain absolute inset-0 opacity-25" />
      </div>
      <div className="relative mx-auto max-w-[1380px]">
        <div className="mb-10 max-w-[760px] md:mb-14">
          <p className="mb-4 text-[11px] tracking-[0.32em] text-[var(--landing-muted)] uppercase">
            {eyebrow}
          </p>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--landing-ink)] md:text-6xl">
            {title}
          </h2>
          <p className="mt-4 max-w-[680px] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  )
}
