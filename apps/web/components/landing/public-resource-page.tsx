/**
 * [INPUT]: 依赖 @/components/shared/brand-mark，依赖 @/components/ui/button，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供公开资源页通用展示组件，支持可选高亮卡片链接
 * [POS]: landing 的公开子页面展示模板，被 /features /models /docs /about 与功能细分页复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ArrowRight, ArrowUpRight } from 'lucide-react'

import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

interface PublicResourcePageProps {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  highlightHrefs?: string[]
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
}

export function PublicResourcePage({
  eyebrow,
  title,
  description,
  highlights,
  highlightHrefs,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PublicResourcePageProps) {
  return (
    <main className="bg-[var(--landing-bg)] px-5 pt-28 pb-20 text-[var(--landing-ink)] md:pt-32 md:pb-28">
      <div className="mx-auto max-w-[1240px]">
        <p className="text-[11px] tracking-[0.32em] text-[var(--landing-muted)] uppercase">
          {eyebrow}
        </p>
        <div className="mt-5 max-w-[900px] space-y-6">
          <BrandMark className="text-3xl md:text-5xl" />
          <h1 className="text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
            {title}
          </h1>
          <p className="max-w-[760px] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
            {description}
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {highlights.map((highlight, index) => {
            const href = highlightHrefs?.[index]
            const cardContent = (
              <>
                <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                  0{index + 1}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">
                  {highlight}
                </p>
              </>
            )
            const cardClassName =
              'rounded-lg border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 transition-colors md:p-7'

            return href ? (
              <Link
                key={highlight}
                href={href}
                className={`${cardClassName} hover:border-white/22 hover:bg-white/[0.065]`}
              >
                {cardContent}
              </Link>
            ) : (
              <article key={highlight} className={cardClassName}>
                {cardContent}
              </article>
            )
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="rounded-lg border border-white/16 bg-white/[0.055] px-7 text-[var(--landing-ink)] hover:border-white/24 hover:bg-white/[0.09] hover:text-[var(--landing-ink)]"
          >
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-lg border-white/14 bg-white/[0.02] px-7 text-[var(--landing-ink)] hover:bg-white/[0.06] hover:text-[var(--landing-ink)]"
          >
            <Link href={secondaryHref}>
              {secondaryLabel}
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
