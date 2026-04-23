/**
 * [INPUT]: 依赖 react 的 ReactNode，依赖 lucide-react 图标，
 *          依赖 @/components/locale-switcher，依赖 @/components/shared/brand-mark，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 AuthShell 认证双栏壳组件
 * [POS]: auth 模块的核心展示组件，被 sign-in/sign-up 页面复用，负责诗性左侧视觉与右侧品牌登录区
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ReactNode } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { BrandMark } from '@/components/shared/brand-mark'
import { Link } from '@/i18n/navigation'

type AuthMode = 'sign-in' | 'sign-up'

interface AuthShellProps {
  mode: AuthMode
  title: string
  subtitle: string
  switchLabel: string
  switchHref: '/sign-in' | '/sign-up'
  switchText: string
  children: ReactNode
  t: {
    brandName: string
    visualEyebrow: string
    visualHeadline: string
    visualDescription: string
    visualPointOne: string
    visualPointTwo: string
    visualPointThree: string
    termsPrefix: string
    termsLink: string
    and: string
    privacyLink: string
    previewHint: string
  }
}

export function AuthShell({
  title,
  subtitle,
  switchLabel,
  switchHref,
  switchText,
  children,
  t,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="grid min-h-screen lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative hidden overflow-hidden border-r border-white/8 bg-[#030303] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.16),transparent_16%),radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.08),transparent_14%),linear-gradient(180deg,#050505_0%,#101010_38%,#020202_100%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:88px_88px]" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />

          <div className="absolute left-[10%] top-[14%] h-28 w-28 rounded-full border border-white/12 bg-[radial-gradient(circle_at_32%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0.22)_34%,rgba(255,255,255,0.02)_76%,transparent_100%)] shadow-[0_20px_70px_rgba(255,255,255,0.08)]" />
          <div className="absolute left-[18%] top-[28%] h-44 w-44 rounded-full border border-white/12 bg-[radial-gradient(circle_at_34%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0.22)_36%,rgba(255,255,255,0.03)_78%,transparent_100%)] shadow-[0_28px_100px_rgba(255,255,255,0.08)]" />
          <div className="absolute left-[44%] top-[18%] h-20 w-20 rounded-full border border-white/12 bg-[radial-gradient(circle_at_34%_30%,rgba(255,255,255,0.82),rgba(255,255,255,0.18)_34%,rgba(255,255,255,0.02)_76%,transparent_100%)] shadow-[0_18px_52px_rgba(255,255,255,0.06)]" />
          <div className="absolute left-[56%] top-[30%] h-56 w-56 rounded-full border border-white/12 bg-[radial-gradient(circle_at_36%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0.18)_36%,rgba(255,255,255,0.03)_78%,transparent_100%)] shadow-[0_32px_120px_rgba(255,255,255,0.07)]" />
          <div className="absolute left-[74%] top-[22%] h-24 w-24 rounded-full border border-white/12 bg-[radial-gradient(circle_at_36%_30%,rgba(255,255,255,0.82),rgba(255,255,255,0.14)_34%,rgba(255,255,255,0.02)_76%,transparent_100%)] shadow-[0_18px_50px_rgba(255,255,255,0.05)]" />
          <div className="absolute left-[28%] top-[48%] h-[22rem] w-[22rem] rounded-full border border-white/12 bg-[radial-gradient(circle_at_36%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0.16)_36%,rgba(255,255,255,0.03)_78%,transparent_100%)] shadow-[0_40px_140px_rgba(255,255,255,0.08)]" />
          <div className="absolute left-[62%] top-[56%] h-40 w-40 rounded-full border border-white/12 bg-[radial-gradient(circle_at_36%_30%,rgba(255,255,255,0.84),rgba(255,255,255,0.14)_34%,rgba(255,255,255,0.02)_76%,transparent_100%)] shadow-[0_24px_80px_rgba(255,255,255,0.06)]" />

          <div className="absolute left-[23%] top-[24%] h-30 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)]" />
          <div className="absolute left-[65%] top-[38%] h-40 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.22),transparent)]" />
          <div className="absolute left-[38%] top-[68%] h-24 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent)]" />

          <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.12)_18%,rgba(0,0,0,0.56)_100%)]" />
          <div className="absolute inset-x-0 bottom-[-8%] h-[34%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_62%)]" />

          <div className="relative flex h-full items-end px-12 py-14 text-white xl:px-16">
            <div className="max-w-[40rem] space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] tracking-[0.28em] text-white/72 uppercase backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t.visualEyebrow}
              </div>
              <h1 className="max-w-[38rem] font-serif text-5xl leading-[1.02] tracking-tight text-white xl:text-6xl">
                {t.visualHeadline}
              </h1>
              <p className="max-w-[34rem] text-lg leading-8 text-white/72">{t.visualDescription}</p>

              <div className="grid gap-4 md:grid-cols-3">
                {[t.visualPointOne, t.visualPointTwo, t.visualPointThree].map((point) => (
                  <div
                    key={point}
                    className="rounded-[30px] border border-white/10 bg-black/18 px-5 py-5 backdrop-blur-md"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/72">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#060606_0%,#101010_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-black/6" />

          <div className="relative z-10 w-full max-w-[560px]">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <BrandMark className="text-2xl text-white">{t.brandName}</BrandMark>
              </div>
              <div className="ml-auto">
                <LocaleSwitcher />
              </div>
            </div>

            <div className="mb-8 space-y-4 text-center">
              <BrandMark className="text-4xl text-white md:text-5xl">{t.brandName}</BrandMark>
              <div className="space-y-2">
                <h2 className="font-serif text-4xl tracking-tight text-white">{title}</h2>
                <p className="mx-auto max-w-md text-sm leading-7 text-white/52">{subtitle}</p>
              </div>
            </div>

            <div className="flex justify-center">{children}</div>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm leading-6 text-white/56">
                {switchLabel}{' '}
                <Link
                  href={switchHref}
                  className="font-medium text-white transition-colors hover:text-white/76"
                >
                  {switchText}
                </Link>
              </p>
              <p className="text-xs leading-6 text-white/34">
                {t.termsPrefix}{' '}
                <Link href="/terms" className="text-white/72 transition-colors hover:text-white">
                  {t.termsLink}
                </Link>{' '}
                {t.and}{' '}
                <Link href="/privacy" className="text-white/72 transition-colors hover:text-white">
                  {t.privacyLink}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
