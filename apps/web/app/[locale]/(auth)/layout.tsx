/**
 * [INPUT]: 依赖 next-intl 的 useLocale，
 *          依赖 @/i18n/navigation 的 useRouter / usePathname，
 *          依赖 lucide-react 的 Globe 图标
 * [OUTPUT]: 对外提供分屏认证布局 (左图右表单)
 * [POS]: (auth) 路由组布局，包裹 sign-in/sign-up 页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'

import { useRouter, usePathname } from '@/i18n/navigation'

/* ─── Component ──────────────────────────────────────── */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = locale === 'en' ? 'zh' : 'en'
  const switchLabel = locale === 'en' ? '中文' : 'English'

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Rose Photo ──────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-black lg:block lg:w-1/2">
        {/* 渐变占位 — 部署时替换为实际玫瑰摄影 via next/image */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/80 via-black/90 to-black" />
        <div className="absolute bottom-1/3 left-1/3 h-[400px] w-[300px] rounded-full bg-rose-500/20 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[200px] w-[200px] rounded-full bg-pink-400/15 blur-[80px]" />
      </div>

      {/* ── Right: Auth Content ───────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-[#0f0f14] lg:w-1/2">
        {/* 语言切换 */}
        <button
          onClick={() => router.replace(pathname, { locale: switchTo })}
          className="absolute right-6 top-6 flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white/90"
        >
          <Globe size={14} />
          <span>{switchLabel}</span>
        </button>

        {children}
      </div>
    </div>
  )
}
