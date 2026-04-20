/**
 * [INPUT]: 依赖 @clerk/nextjs 的 ClerkProvider，依赖 @clerk/localizations 的 zhCN，
 *          依赖 next-intl 的 NextIntlClientProvider / hasLocale，
 *          依赖 next-intl/server 的 getMessages / setRequestLocale，
 *          依赖 @/i18n/routing 的 routing 配置，
 *          依赖 next/font/google 的 Geist 字体，
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
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryProvider } from '@/lib/query/provider'
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

/* ─── Static Params ─────────────────────────────────────── */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

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

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider
          localization={locale === 'zh' ? zhCN : undefined}
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
