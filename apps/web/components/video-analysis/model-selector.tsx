/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 ModelSelector AI 模型选择组件
 * [POS]: video-analysis 的模型配置区，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'

/* ─── Available Models ───────────────────────────────── */

const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
] as const

/* ─── Component ──────────────────────────────────────── */

export function ModelSelector() {
  const t = useTranslations('videoAnalysis')
  const [model, setModel] = useState<string>(MODELS[0].id)
  const [open, setOpen] = useState(false)

  const selectedLabel = MODELS.find((m) => m.id === model)?.label ?? model

  return (
    <div>
      <label className="text-sm font-medium text-foreground">{t('aiModel')}</label>
      <div className="relative mt-1.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors hover:border-brand-300"
        >
          <span>{selectedLabel}</span>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background py-1 shadow-lg">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setModel(m.id)
                  setOpen(false)
                }}
                className={`flex w-full px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  model === m.id ? 'text-brand-600 font-medium' : 'text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
