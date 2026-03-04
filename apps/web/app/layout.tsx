/**
 * [INPUT]: 依赖 @/app/globals.css 的全局样式, next/font/google 的字体
 * [OUTPUT]: 对外提供应用根布局（html/body 包裹）
 * [POS]: App Router 的最顶层布局，所有页面的父级
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Nano Banana Canvas',
    template: '%s | Nano Banana Canvas',
  },
  description: 'Visual AI Workflow Platform — Build, share, and run AI workflows',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
