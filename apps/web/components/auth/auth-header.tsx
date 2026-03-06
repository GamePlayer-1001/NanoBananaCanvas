/**
 * [INPUT]: 依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 AuthHeader 组件 (Logo + 欢迎标题)
 * [POS]: auth 的顶部装饰区域，被 sign-in/sign-up 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

/* ─── Component ──────────────────────────────────────── */

export function AuthHeader() {
  const t = useTranslations('auth')

  return (
    <div className="mb-8 flex flex-col items-center">
      {/* Logo 占位 — 部署时替换为实际品牌 Logo */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/25">
        <span className="text-[10px] tracking-wider text-white/30">LOGO</span>
      </div>

      {/* 欢迎标题 */}
      <h1 className="text-2xl tracking-wide text-white/90">
        {t('welcome')}{' '}
        <span className="font-serif text-3xl italic">{t('brandName')}</span>
      </h1>
    </div>
  )
}
