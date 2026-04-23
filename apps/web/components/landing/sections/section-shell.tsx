/**
 * [INPUT]: 依赖 react 的 ReactNode 类型
 * [OUTPUT]: 对外提供 SectionShell 板块外壳组件
 * [POS]: landing/sections 的布局基础，被各首页内容板块复用
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
      className="landing-snap-section relative border-t border-white/6 px-5 py-20 md:py-28 lg:scroll-mt-24"
    >
      <div className="mx-auto max-w-[1380px]">
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
