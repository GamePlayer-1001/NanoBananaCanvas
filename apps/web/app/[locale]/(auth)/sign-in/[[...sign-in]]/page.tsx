/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignIn，依赖 next-intl/server 的 getTranslations / setRequestLocale，
 *          依赖 @/components/auth/auth-shell，依赖 @/lib/auth/redirect
 * [OUTPUT]: 对外提供登录页路由
 * [POS]: (auth) 路由组的登录页入口，承载真实 Clerk 登录卡片与无说明标题区的品牌认证壳层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/auth-shell'
import { resolveSafeAuthRedirect } from '@/lib/auth/redirect'
import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata: Metadata = NO_INDEX_METADATA

const CLERK_CARD_APPEARANCE = {
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'w-full rounded-[28px] border border-black/8 bg-white px-6 py-7 shadow-[0_34px_90px_rgba(17,17,17,0.14)]',
    header: 'hidden',
    footer: 'hidden',
    socialButtonsBlockButton:
      'h-12 rounded-2xl border border-black/10 bg-white text-[15px] font-medium text-[#111111] shadow-none transition-colors hover:bg-black/[0.03]',
    socialButtonsBlockButtonText: 'text-[15px] font-medium text-[#111111]',
    dividerLine: 'bg-black/10',
    dividerText: 'text-xs tracking-[0.18em] text-black/38 uppercase',
    formFieldLabel: 'text-sm font-medium text-[#111111]',
    formFieldInput:
      'h-11 rounded-2xl border border-black/10 bg-white text-[15px] text-[#111111] placeholder:text-black/30 shadow-none focus:border-[#5b53c7] focus:ring-4 focus:ring-[#5b53c7]/12',
    formButtonPrimary:
      'h-12 rounded-2xl border-0 bg-[#5b53c7] text-[15px] font-medium text-white shadow-none transition-colors hover:bg-[#4d46b4]',
    formFieldAction: 'text-sm font-medium text-black/48 hover:text-[#5b53c7]',
    identityPreviewText: 'text-black/58',
    formResendCodeLink: 'text-[#5b53c7] hover:text-[#4d46b4]',
    otpCodeFieldInput:
      'h-12 w-10 rounded-2xl border border-black/10 bg-white text-[#111111] shadow-none focus:border-[#5b53c7] focus:ring-4 focus:ring-[#5b53c7]/12',
    alertText: 'text-sm',
    formHeaderTitle: 'hidden',
    formHeaderSubtitle: 'hidden',
  },
} as const

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ redirect_url?: string }>
}) {
  const { locale } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const redirectUrl = resolveSafeAuthRedirect(locale, resolvedSearchParams?.redirect_url)
  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <AuthShell
      mode="sign-in"
      title={t('loginTitle')}
      switchLabel={t('noAccount')}
      switchHref="/sign-up"
      switchText={t('register')}
      t={{
        brandName: t('brandName'),
        visualHeadline: t('visualHeadline'),
        visualDescription: t('visualDescription'),
        visualPointOne: t('visualPointOne'),
        visualPointTwo: t('visualPointTwo'),
        visualPointThree: t('visualPointThree'),
        termsPrefix: t('termsPrefix'),
        termsLink: t('termsLink'),
        and: t('and'),
        privacyLink: t('privacyLink'),
      }}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
        appearance={CLERK_CARD_APPEARANCE}
      />
    </AuthShell>
  )
}
