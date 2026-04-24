/**
 * [INPUT]: 依赖 lucide-react 的 ArrowRight，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 MarketingShell、MarketingHero、MarketingSection、MarketingCardGrid、MarketingCard、MarketingActionStrip
 * [POS]: components/landing 的公开子页面构件层，被 features/models/about/docs/community/policy 等 SEO 页面复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'

type MarketingLink = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

type MarketingFact = {
  title: string
  body: string
}

type MarketingCardProps = {
  eyebrow?: string
  title: string
  body: string
  bullets?: string[]
  href?: string
  actionLabel?: string
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative overflow-hidden bg-[#09090d] px-4 pb-24 pt-28 sm:px-6 lg:px-8 xl:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_18%),radial-gradient(circle_at_16%_22%,rgba(120,92,255,0.12),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(54,163,255,0.09),transparent_18%),linear-gradient(180deg,#09090d_0%,#06070b_100%)]" />
      <div className="relative mx-auto w-full max-w-[1380px]">{children}</div>
    </main>
  )
}

export function MarketingHero({
  eyebrow,
  title,
  body,
  links,
  facts,
}: {
  eyebrow: string
  title: string
  body: string
  links?: MarketingLink[]
  facts?: MarketingFact[]
}) {
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="max-w-[56rem]">
        <p className="text-sm font-medium tracking-[0.24em] text-white/42 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-[14ch] text-[3rem] leading-[0.92] font-semibold tracking-tight text-white md:text-[4.7rem]">
          {title}
        </h1>
        <p className="mt-7 max-w-[48rem] text-[1.05rem] leading-8 text-white/64 md:text-[1.18rem] md:leading-9">
          {body}
        </p>

        {links?.length ? (
          <div className="mt-10 flex flex-wrap gap-4">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={
                  link.variant === 'secondary'
                    ? 'inline-flex h-12 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-medium text-white transition hover:bg-white/8'
                    : 'inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90'
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {facts?.length ? (
        <aside className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.22)]">
          <div className="space-y-4">
            {facts.map((fact) => (
              <div
                key={fact.title}
                className="rounded-[24px] border border-white/8 bg-black/18 px-5 py-4"
              >
                <p className="text-sm font-semibold text-white">{fact.title}</p>
                <p className="mt-2 text-sm leading-7 text-white/58">{fact.body}</p>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  )
}

export function MarketingSection({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-24">
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div>
          <p className="text-sm font-medium tracking-[0.24em] text-white/42 uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {title}
          </h2>
        </div>
        <p className="max-w-[48rem] text-base leading-7 text-white/60 md:text-lg md:leading-8">
          {body}
        </p>
      </div>
      <div className="mt-12">{children}</div>
    </section>
  )
}

export function MarketingCardGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}) {
  const className =
    columns === 2
      ? 'grid gap-5 lg:grid-cols-2'
      : columns === 4
        ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-4'
        : 'grid gap-5 lg:grid-cols-3'

  return <div className={className}>{children}</div>
}

export function MarketingCard({
  eyebrow,
  title,
  body,
  bullets,
  href,
  actionLabel,
}: MarketingCardProps) {
  return (
    <article className="flex h-full flex-col rounded-[30px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.2)]">
      {eyebrow ? (
        <p className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/62 md:text-[0.96rem]">{body}</p>

      {bullets?.length ? (
        <ul className="mt-6 space-y-3 text-sm leading-7 text-white/74">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/72" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {href && actionLabel ? (
        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-white/88 transition hover:text-white"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </article>
  )
}

export function MarketingActionStrip({
  title,
  body,
  links,
}: {
  title: string
  body: string
  links: MarketingLink[]
}) {
  return (
    <section className="mt-24 rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-10 shadow-[0_28px_120px_rgba(0,0,0,0.24)] sm:px-8 lg:flex lg:items-end lg:justify-between lg:gap-10">
      <div className="max-w-[42rem]">
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-8 text-white/62">{body}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 lg:mt-0 lg:justify-end">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={
              link.variant === 'secondary'
                ? 'inline-flex h-12 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-medium text-white transition hover:bg-white/8'
                : 'inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
