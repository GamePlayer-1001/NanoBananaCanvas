/**
 * [INPUT]: 依赖 lucide-react 的 ArrowLeft，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 MarketingBackLink 返回首页按钮
 * [POS]: components/landing 的法务页轻量构件层，仅被 privacy/terms 页面复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ArrowLeft } from 'lucide-react'

import { Link } from '@/i18n/navigation'

export function MarketingBackLink({ label }: { label: string }) {
  return (
    <div className="mb-10 flex items-start">
      <Link
        href="/"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-4 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </div>
  )
}
