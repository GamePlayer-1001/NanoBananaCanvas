/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 AnalysisHistory 分析历史折叠面板（支持分析中/成功/失败状态展示）
 * [POS]: video-analysis 的历史记录区域，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { History, CircleCheck, CircleX, LoaderCircle } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────── */

export interface VideoAnalysisHistoryItem {
  id: string
  fileName: string
  durationLabel: string
  modelLabel: string
  createdAtLabel: string
  status: 'processing' | 'completed' | 'failed'
  errorMessage?: string
}

/* ─── Component ──────────────────────────────────────── */

export function AnalysisHistory({
  items,
}: {
  items: VideoAnalysisHistoryItem[]
}) {
  const t = useTranslations('videoAnalysis')

  function renderStatus(item: VideoAnalysisHistoryItem) {
    if (item.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <CircleCheck size={12} />
          {t('historyCompleted')}
        </span>
      )
    }

    if (item.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
          <CircleX size={12} />
          {t('historyFailed')}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        <LoaderCircle size={12} className="animate-spin" />
        {t('historyProcessing')}
      </span>
    )
  }

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <History size={16} />
        {t('analysisHistory')}
      </h2>

      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border py-12">
          <History size={32} className="text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">{t('noHistory')}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.fileName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.durationLabel} · {item.modelLabel} · {item.createdAtLabel}
                  </p>
                </div>
                {renderStatus(item)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.status === 'completed'
                  ? t('historyCompletedDescription')
                  : item.status === 'failed'
                    ? item.errorMessage || t('historyFailedDescription')
                    : t('historyProcessingDescription')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
