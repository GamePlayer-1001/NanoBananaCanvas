/**
 * [INPUT]: 依赖 react 的 useEffect/useMemo/useState，依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 Link，依赖 lucide-react 的 Clock3/X
 * [OUTPUT]: 对外提供 GlobalPromoBar 工作台宣传条组件（支持会话级关闭记忆、循环倒计时与订阅跳转）
 * [POS]: layout 的全局顶部横条，被 (app)/layout.tsx 消费；下方应用区用弹性高度适配有无通知条
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const PROMO_STORAGE_KEY = 'global-promo-bar:hidden:v2'
const PROMO_CYCLE_MS = 30 * 24 * 60 * 60 * 1000
const PROMO_EPOCH_UTC = Date.UTC(2026, 0, 1, 0, 0, 0)

function padTime(value: number) {
  return value.toString().padStart(2, '0')
}

function getRemainingMs(now: number) {
  const elapsed = (now - PROMO_EPOCH_UTC) % PROMO_CYCLE_MS
  const normalizedElapsed = elapsed < 0 ? elapsed + PROMO_CYCLE_MS : elapsed
  return PROMO_CYCLE_MS - normalizedElapsed
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${padTime(days)} : ${padTime(hours)} : ${padTime(minutes)} : ${padTime(seconds)}`
}

/* ─── Component ──────────────────────────────────────── */

export function GlobalPromoBar() {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [now, setNow] = useState(0)
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.sessionStorage.getItem(PROMO_STORAGE_KEY) !== '1'
  })
  const countdownLabel = useMemo(
    () => (now > 0 ? formatCountdown(getRemainingMs(now)) : '-- : -- : -- : --'),
    [now],
  )

  useEffect(() => {
    const syncNow = window.setTimeout(() => {
      setNow(Date.now())
    }, 0)
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearTimeout(syncNow)
      window.clearInterval(timer)
    }
  }, [])

  const handleClose = () => {
    window.sessionStorage.setItem(PROMO_STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="border-b border-[#d9cf2f] bg-[#fbf44f] text-stone-900">
      <div className="mx-auto flex min-h-[50px] w-full max-w-[1760px] items-center gap-3 px-3 py-1.5 sm:px-5 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <p className="truncate text-[15px] font-medium leading-6 sm:text-[20px]">
            {locale === 'zh' ? (
              <>
                <strong className="font-black">{t('promoTitle')}</strong>
                {' '}
                价格狂欢：套餐首月
                <strong className="font-black">免费</strong>
                ！创作自由就现在！
              </>
            ) : (
              <>
                <strong className="font-black">GPT Image 2</strong>
                {' '}
                price carnival: first month
                {' '}
                <strong className="font-black">free</strong>
                {' '}
                on plans, and your next creative run starts now.
              </>
            )}
          </p>
          <div className="hidden h-7 w-px bg-black/20 lg:block" />
          <div className="inline-flex shrink-0 items-center gap-2.5 rounded-2xl border border-black/20 bg-[#fff86d] px-3 py-1.5 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.45)]">
            <Clock3 size={15} className="shrink-0" />
            <span className="font-mono text-[15px] font-normal tracking-[0.04em] text-stone-950 sm:text-[20px]">
              {countdownLabel}
            </span>
          </div>
          <div className="hidden h-7 w-px bg-black/20 lg:block" />
          <Link
            href="/account?tab=subscription"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-stone-950 px-5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 sm:px-6 sm:text-sm"
          >
            {t('promoCta')}
          </Link>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="ml-2 mr-[36px] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-black/5 hover:text-stone-950 sm:ml-3 lg:ml-5"
          aria-label={t('closePromo')}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
