/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 AnalysisHistory 分析历史折叠面板
 * [POS]: video-analysis 的历史记录区域，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { History } from 'lucide-react'

/* ─── Component ──────────────────────────────────────── */

export function AnalysisHistory() {
  const t = useTranslations('videoAnalysis')

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <History size={16} />
        {t('analysisHistory')}
      </h2>

      {/* 空状态 — 后续接 API 填充 */}
      <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border py-12">
        <History size={32} className="text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">{t('noHistory')}</p>
      </div>
    </div>
  )
}
