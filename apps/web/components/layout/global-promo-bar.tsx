/**
 * [INPUT]: 依赖 react 的 useEffect/useState，依赖 next-intl 的 useTranslations，
 *          依赖 lucide-react 的 Flame/X
 * [OUTPUT]: 对外提供 GlobalPromoBar 全局宣传条组件（支持会话级关闭记忆）
 * [POS]: layout 的全局顶部横条，被 (app)/layout.tsx 消费，统一承接工作台级促销提示
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { Flame, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const PROMO_STORAGE_KEY = 'global-promo-bar:hidden:v2'

/* ─── Component ──────────────────────────────────────── */

export function GlobalPromoBar() {
  const t = useTranslations('explore')
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.sessionStorage.getItem(PROMO_STORAGE_KEY) !== '1'
  })

  const handleClose = () => {
    window.sessionStorage.setItem(PROMO_STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="border-b border-amber-200 bg-[#fff4bf] text-stone-800">
      <div className="mx-auto flex min-h-11 w-full max-w-[1920px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Flame size={14} />
          </span>
          <p className="truncate text-sm">
            <span className="font-semibold">{t('promoTitle')}</span>
            <span className="ml-2 text-stone-600">{t('promoBody')}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-black/5 hover:text-stone-900"
          aria-label={t('closePromo')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
