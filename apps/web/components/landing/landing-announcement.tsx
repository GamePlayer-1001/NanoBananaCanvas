/**
 * [INPUT]: 依赖 react 的 useEffect/useState，依赖 next-intl 的 useTranslations，
 *          依赖 lucide-react 的 X/Megaphone
 * [OUTPUT]: 对外提供 LandingAnnouncement 公告弹窗组件（支持今日不再 / 直接关闭，LocalStorage 持久化）
 * [POS]: landing 的公告弹窗，被 (landing)/layout.tsx 消费；默认每日首次打开展示，今日不再后当天不重复出现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'nbc_announcement_dismissed_date'

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

/* ─── Component ──────────────────────────────────────── */

export function LandingAnnouncement() {
  const t = useTranslations('landing.announcement')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const dismissed = localStorage.getItem(STORAGE_KEY)
        if (dismissed !== getTodayString()) {
          setOpen(true)
        }
      } catch {
        setOpen(true)
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  const handleClose = () => {
    setOpen(false)
  }

  const handleNotToday = () => {
    try {
      localStorage.setItem(STORAGE_KEY, getTodayString())
    } catch {
      // ignore
    }
    setOpen(false)
  }

  if (!open) return null

  const bodyLines = t('body').split('\n')

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-[520px] flex-col rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Megaphone size={18} className="shrink-0 text-stone-700" />
            <span id="announcement-title" className="text-base font-semibold text-stone-900">
              {t('title')}
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
              {t('badge')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[400px] overflow-y-auto overscroll-contain px-6 py-5">
          <div className="space-y-3 text-[14px] leading-7 text-stone-700">
            {bodyLines.map((line, i) => {
              if (line.trim() === '') return <div key={i} className="h-1" />
              return (
                <p key={i} className="whitespace-pre-wrap">
                  {line}
                </p>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-6 py-4">
          <button
            type="button"
            onClick={handleNotToday}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            {t('notTodayBtn')}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
