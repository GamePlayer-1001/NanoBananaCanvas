/**
 * [INPUT]: 依赖 @clerk/nextjs 的 ClerkProvider，依赖 @clerk/localizations 的 zhCN，
 *          依赖 next-intl 的 NextIntlClientProvider / hasLocale，
 *          依赖 next-intl/server 的 getMessages / setRequestLocale，
 *          依赖 @/i18n/routing 的 routing 配置，依赖 @/i18n/config 的 locale 元数据，
 *          依赖 next/font/google 的 Geist / Geist_Mono / Kaushan_Script 字体，
 *          依赖 @/components/ui/sonner 的 Toaster，
 *          依赖 @/components/ui/tooltip 的 TooltipProvider，
 *          依赖 @/lib/query/provider 的 QueryProvider
 * [OUTPUT]: 对外提供带 locale 参数的语言布局 (html/body + Clerk/i18n/Query Provider)
 * [POS]: [locale] 动态路由布局，包裹所有语言相关页面，是 Clerk、i18n 与 Query 的枢纽
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { zhCN } from '@clerk/localizations'
import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Geist, Geist_Mono, Kaushan_Script } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryProvider } from '@/lib/query/provider'
import { getLocaleDefinition } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import '@/app/globals.css'

/* ─── Fonts ─────────────────────────────────────────────── */

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const brandScript = Kaushan_Script({
  variable: '--font-brand-script',
  subsets: ['latin'],
  weight: '400',
})

/* ─── Static Params ─────────────────────────────────────── */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/* ─── Clerk Redirects ─────────────────────────────────── */

const CLERK_SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in'
const CLERK_SIGN_UP_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up'
const CLERK_SIGN_IN_FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/workspace'
const CLERK_SIGN_UP_FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/workspace'
const CLERK_PROXY_URL = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

/* ─── Layout ────────────────────────────────────────────── */

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const localeDefinition = getLocaleDefinition(locale)
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${brandScript.variable} antialiased`}
      >
        <ClerkProvider
          localization={localeDefinition.clerkLocalizationKey === 'zhCN' ? zhCN : undefined}
          signInUrl={CLERK_SIGN_IN_URL}
          signUpUrl={CLERK_SIGN_UP_URL}
          signInFallbackRedirectUrl={CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
          signUpFallbackRedirectUrl={CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}
          proxyUrl={CLERK_PROXY_URL}
          appearance={{ cssLayerName: 'clerk' }}
        >
          <TooltipProvider>
            <NextIntlClientProvider messages={messages}>
              <QueryProvider>
                {children}
              </QueryProvider>
            </NextIntlClientProvider>
          </TooltipProvider>
        </ClerkProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
