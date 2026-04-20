/**
 * [INPUT]: 依赖 lucide-react 图标，依赖 @/components/ui/button / card / input / label，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 AuthShell 认证双栏壳组件
 * [POS]: auth 模块的核心展示组件，被 sign-in/sign-up 页面复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ArrowRight, Github, LockKeyhole, Mail, PanelsTopLeft, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'

type AuthMode = 'sign-in' | 'sign-up'

interface AuthShellProps {
  mode: AuthMode
  title: string
  subtitle: string
  ctaLabel: string
  switchLabel: string
  switchHref: '/sign-in' | '/sign-up'
  switchText: string
  t: {
    brandName: string
    visualEyebrow: string
    visualHeadline: string
    visualDescription: string
    visualPointOne: string
    visualPointTwo: string
    visualPointThree: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    forgotPassword: string
    divider: string
    continueWithGoogle: string
    continueWithGithub: string
    termsPrefix: string
    termsLink: string
    and: string
    privacyLink: string
    previewHint: string
  }
}

export function AuthShell({
  mode,
  title,
  subtitle,
  ctaLabel,
  switchLabel,
  switchHref,
  switchText,
  t,
}: AuthShellProps) {
  const isSignIn = mode === 'sign-in'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(244,114,182,0.16),_transparent_28%),linear-gradient(135deg,_#09090d_0%,_#111322_46%,_#09090d_100%)]" />
      <div className="absolute inset-y-0 left-[14%] hidden w-px bg-white/8 lg:block" />
      <div className="absolute right-[10%] top-[12%] hidden h-56 w-56 rounded-full bg-brand-500/18 blur-3xl lg:block" />
      <div className="absolute bottom-[10%] left-[8%] hidden h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl lg:block" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1500px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <PanelsTopLeft className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.28em] text-white/45 uppercase">
                {t.visualEyebrow}
              </p>
              <p className="mt-1 text-base font-semibold text-white">{t.brandName}</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs tracking-[0.22em] text-white/62 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              {isSignIn ? 'Martini-style Auth Shell' : 'Account Creation Surface'}
            </div>
            <h1 className="mt-8 max-w-2xl font-serif text-5xl leading-[1.02] tracking-tight text-white xl:text-6xl">
              {t.visualHeadline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/68">
              {t.visualDescription}
            </p>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[t.visualPointOne, t.visualPointTwo, t.visualPointThree].map((point) => (
                <div
                  key={point}
                  className="rounded-[28px] border border-white/10 bg-white/[0.045] px-5 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/8">
                    <ArrowRight className="h-4 w-4 text-white/90" />
                  </div>
                  <p className="mt-5 text-sm leading-6 text-white/74">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[32px] border border-white/10 bg-black/20 px-6 py-5 text-sm text-white/55 backdrop-blur-sm">
            <span>{t.previewHint}</span>
            <Link href="/explore" className="font-medium text-white transition-colors hover:text-brand-200">
              Explore Gallery
            </Link>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-4 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-[520px]">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                  <PanelsTopLeft className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="font-semibold tracking-tight text-white">{t.brandName}</span>
              </Link>
              <Link href="/explore" className="text-sm text-white/62 transition-colors hover:text-white">
                Back
              </Link>
            </div>

            <Card className="overflow-hidden rounded-[32px] border-white/10 bg-[#11131a]/88 py-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <CardHeader className="gap-3 border-b border-white/8 px-7 pt-7 pb-6 sm:px-9">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-semibold tracking-tight text-white">
                      {title}
                    </CardTitle>
                    <CardDescription className="mt-3 max-w-sm text-sm leading-6 text-white/58">
                      {subtitle}
                    </CardDescription>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 sm:flex">
                    {isSignIn ? (
                      <LockKeyhole className="h-4.5 w-4.5 text-white/76" />
                    ) : (
                      <Sparkles className="h-4.5 w-4.5 text-white/76" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-7 pt-7 pb-6 sm:px-9">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M21.35 11.1h-9.17v2.98h5.26c-.23 1.5-1.08 2.77-2.3 3.63v2.99h3.72c2.18-2.01 3.44-4.98 3.44-8.52 0-.73-.07-1.43-.2-2.08Z"
                      />
                      <path
                        fill="currentColor"
                        d="M12.18 22c3.11 0 5.72-1.03 7.63-2.8l-3.72-2.99c-1.03.69-2.34 1.09-3.91 1.09-3 0-5.54-2.02-6.45-4.73H1.88v3.08A11.53 11.53 0 0 0 12.18 22Z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.73 12.56a6.9 6.9 0 0 1 0-4.4V5.08H1.88a11.5 11.5 0 0 0 0 10.56l3.85-3.08Z"
                      />
                      <path
                        fill="currentColor"
                        d="M12.18 6.54c1.69 0 3.21.58 4.41 1.71l3.31-3.31C17.89 3.07 15.29 2 12.18 2A11.53 11.53 0 0 0 1.88 8.36l3.85 3.08c.91-2.71 3.45-4.9 6.45-4.9Z"
                      />
                    </svg>
                    {t.continueWithGoogle}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
                  >
                    <Github className="h-4 w-4" />
                    {t.continueWithGithub}
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs tracking-[0.2em] text-white/28 uppercase">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>{t.divider}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor={`${mode}-email`} className="text-white/72">
                      {t.emailLabel}
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <Input
                        id={`${mode}-email`}
                        type="email"
                        placeholder={t.emailPlaceholder}
                        className="h-12 rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-white/26 focus-visible:border-brand-400 focus-visible:ring-brand-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor={`${mode}-password`} className="text-white/72">
                        {t.passwordLabel}
                      </Label>
                      {isSignIn ? (
                        <button
                          type="button"
                          className="text-xs font-medium text-white/56 transition-colors hover:text-white"
                        >
                          {t.forgotPassword}
                        </button>
                      ) : null}
                    </div>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <Input
                        id={`${mode}-password`}
                        type="password"
                        placeholder={t.passwordPlaceholder}
                        className="h-12 rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-white/26 focus-visible:border-brand-400 focus-visible:ring-brand-500/20"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl bg-white text-[#0a0a0e] hover:bg-white/92"
                  >
                    {ctaLabel}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col items-stretch gap-4 border-t border-white/8 px-7 pt-6 pb-7 sm:px-9">
                <p className="text-center text-sm leading-6 text-white/56">
                  {switchLabel}{' '}
                  <Link href={switchHref} className="font-medium text-white transition-colors hover:text-brand-200">
                    {switchText}
                  </Link>
                </p>
                <p className="text-center text-xs leading-6 text-white/36">
                  {t.termsPrefix}{' '}
                  <Link href="/terms" className="text-white/70 transition-colors hover:text-white">
                    {t.termsLink}
                  </Link>{' '}
                  {t.and}{' '}
                  <Link href="/privacy" className="text-white/70 transition-colors hover:text-white">
                    {t.privacyLink}
                  </Link>
                </p>
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs leading-5 text-white/42">
                  {t.previewHint}
                </p>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
