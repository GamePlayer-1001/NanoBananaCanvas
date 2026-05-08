/**
 * [INPUT]: 依赖 next/font/google 的 Geist / Geist_Mono / Kaushan_Script 字体，
 *          依赖全局样式 '@/app/globals.css'
 * [OUTPUT]: 对外提供应用根布局 (html/body + fallback metadata + 全局字体变量)
 * [POS]: App Router 的最顶层布局，负责输出合法文档骨架；[locale]/layout.tsx 只承接 locale provider 与运行时上下文
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { Geist, Geist_Mono, Kaushan_Script } from 'next/font/google'
import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'
import '@/app/globals.css'

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

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  category: 'technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    url: BASE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    title: SITE_NAME,
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${brandScript.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
