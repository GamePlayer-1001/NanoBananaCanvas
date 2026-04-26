/**
 * [INPUT]: 依赖 react 的 ReactNode，依赖 next/image 的静态图片渲染，
 *          依赖 lucide-react 的 ArrowRight 图标，
 *          依赖 @/components/locale-switcher，依赖 @/components/shared/brand-mark，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 AuthShell 认证双栏壳组件
 * [POS]: auth 模块的核心展示组件，被 sign-in/sign-up 页面复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Image from 'next/image'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

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
    visualHeadline: string
    visualDescription: string
    visualPointOne: string
    visualPointTwo: string
    visualPointThree: string
    termsPrefix: string
    termsLink: string
    and: string
    privacyLink: string
  }
}

export function AuthShell({
  mode,
  title,
  subtitle,
  switchLabel,
  switchHref,
  switchText,
  children,
  t,
}: AuthShellProps) {
  const isSignIn = mode === 'sign-in'

  return (
    <div className="min-h-screen bg-[#f6f3ef]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-[#1a120f] lg:block">
          {isSignIn ? (
            <>
              <Image
                src="/auth-login-visual.png"
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,18,0.1),rgba(6,8,18,0.48)),radial-gradient(circle_at_20%_16%,rgba(255,232,192,0.24),transparent_24%),radial-gradient(circle_at_76%_28%,rgba(111,120,255,0.22),transparent_28%),radial-gradient(circle_at_50%_82%,rgba(255,128,192,0.14),transparent_30%)]" />
              <div className="absolute inset-0 backdrop-blur-[1px]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,_rgba(255,226,205,0.42),_transparent_18%),radial-gradient(circle_at_70%_18%,_rgba(254,114,144,0.18),_transparent_22%),radial-gradient(circle_at_28%_82%,_rgba(236,72,153,0.18),_transparent_18%),radial-gradient(circle_at_78%_72%,_rgba(59,130,246,0.15),_transparent_20%),linear-gradient(180deg,_rgba(12,8,7,0.16),_rgba(12,8,7,0.42))]" />
              <div className="absolute inset-0 [background-image:radial-gradient(circle_at_center,_rgba(255,255,255,0.55)_0,_transparent_18%),radial-gradient(circle_at_center,_rgba(96,165,250,0.6)_0,_transparent_12%),radial-gradient(circle_at_center,_rgba(251,113,133,0.5)_0,_transparent_12%)] [background-size:140px_140px,180px_180px,220px_220px] [background-position:0_0,40px_40px,80px_12px] opacity-80" />
              <div className="absolute inset-0 backdrop-blur-[2px]" />

              <div className="absolute bottom-[-8%] -left-16 h-[34rem] w-[28rem] rotate-[-14deg] rounded-[58%_42%_62%_38%/48%_44%_56%_52%] border border-white/10 bg-[radial-gradient(circle_at_35%_35%,_rgba(255,228,228,0.88),_rgba(237,145,163,0.72)_42%,_rgba(115,44,54,0.16)_78%,_transparent_100%)] shadow-[0_40px_100px_rgba(0,0,0,0.4)]" />
              <div className="absolute top-[12%] left-[16%] h-[22rem] w-[18rem] rotate-[8deg] rounded-[56%_44%_60%_40%/42%_52%_48%_58%] border border-white/12 bg-[radial-gradient(circle_at_38%_30%,_rgba(255,234,234,0.92),_rgba(238,164,176,0.76)_46%,_rgba(117,57,69,0.18)_84%,_transparent_100%)] shadow-[0_36px_90px_rgba(0,0,0,0.34)]" />
              <div className="absolute right-[8%] bottom-[18%] h-36 w-24 rotate-[12deg] rounded-[56%_44%_60%_40%/42%_52%_48%_58%] border border-white/10 bg-[radial-gradient(circle_at_38%_30%,_rgba(255,230,236,0.9),_rgba(234,113,135,0.78)_46%,_rgba(105,35,54,0.12)_84%,_transparent_100%)] shadow-[0_22px_60px_rgba(0,0,0,0.34)]" />
            </>
          )}

          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/8 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/28 to-transparent" />

          <div className="relative flex h-full flex-col justify-end px-10 py-12 text-white xl:px-14 xl:py-14">
            <div className="max-w-xl space-y-8">
              <h1 className="max-w-xl font-serif text-5xl leading-[1.02] tracking-tight text-white xl:text-6xl">
                {t.visualHeadline}
              </h1>
              <p className="max-w-lg text-lg leading-8 text-white/72">
                {t.visualDescription}
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {[t.visualPointOne, t.visualPointTwo, t.visualPointThree].map((point) => (
                  <div
                    key={point}
                    className="rounded-[28px] border border-white/12 bg-black/16 px-5 py-5 backdrop-blur-md"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_32%),linear-gradient(180deg,_#f8f6f3_0%,_#f5f1ed_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-black/6" />

          <div className="relative z-10 w-full max-w-[560px]">
            <div className="mb-8 flex items-center justify-between">
              <div className="lg:hidden">
                <BrandMark withLogo className="text-lg text-black">
                  {t.brandName}
                </BrandMark>
              </div>
              <div className="ml-auto">
                <LocaleSwitcher />
              </div>
            </div>

            <div className="mb-8 space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-black/8 bg-white shadow-[0_16px_40px_rgba(20,20,20,0.08)]">
                <BrandMark
                  withLogo
                  showText={false}
                  className="text-[1.85rem] text-black"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <BrandMark withLogo className="text-xl text-black/58">
                    {t.brandName}
                  </BrandMark>
                </div>
                <h2 className="font-serif text-4xl tracking-tight text-[#111111]">
                  {title}
                </h2>
                <p className="mx-auto max-w-md text-sm leading-7 text-black/54">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex justify-center">{children}</div>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm leading-6 text-black/54">
                {switchLabel}{' '}
                <Link
                  href={switchHref}
                  className="font-medium text-[#5b53c7] transition-colors hover:text-[#4b45ad]"
                >
                  {switchText}
                </Link>
              </p>
              <p className="text-xs leading-6 text-black/38">
                {t.termsPrefix}{' '}
                <Link
                  href="/terms"
                  className="text-[#5b53c7] transition-colors hover:text-[#4b45ad]"
                >
                  {t.termsLink}
                </Link>{' '}
                {t.and}{' '}
                <Link
                  href="/privacy"
                  className="text-[#5b53c7] transition-colors hover:text-[#4b45ad]"
                >
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
