/**
 * [INPUT]: 依赖 @clerk/nextjs 的 ClerkProvider，
 *          依赖 next-intl 的 NextIntlClientProvider / hasLocale，
 *          依赖 next-intl/server 的 getMessages / setRequestLocale，
 *          依赖 @/i18n/routing 的 routing 配置，
 *          依赖 next/font/google 的 Geist 字体，
 *          依赖 @/components/ui/sonner 的 Toaster
 * [OUTPUT]: 对外提供带 locale 参数的语言布局 (html/body + Clerk + i18n Provider)
 * [POS]: [locale] 动态路由布局，包裹所有语言相关页面，认证 + i18n 的枢纽
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from '@clerk/localizations'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
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
        <ClerkProvider {...(locale === 'zh' ? { localization: zhCN } : {})}>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
          <Toaster position="bottom-right" richColors />
        </ClerkProvider>
      </body>
    </html>
  )
}
