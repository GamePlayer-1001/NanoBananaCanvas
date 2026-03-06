/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/video-analysis/upload-area，
 *          依赖 @/components/video-analysis/model-selector，
 *          依赖 @/components/video-analysis/analysis-history
 * [OUTPUT]: 对外提供 VideoAnalysisContent 客户端交互容器
 * [POS]: video-analysis 的客户端组合组件，被 page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { UploadArea } from './upload-area'
import { ModelSelector } from './model-selector'
import { AnalysisHistory } from './analysis-history'

/* ─── Component ──────────────────────────────────────── */

export function VideoAnalysisContent() {
  const t = useTranslations('videoAnalysis')

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      {/* 标题 */}
      <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>

      {/* 上传区域 */}
      <div className="mt-8">
        <UploadArea />
      </div>

      {/* AI 模型选择 */}
      <div className="mt-6">
        <ModelSelector />
      </div>

      {/* 分析历史 */}
      <div className="mt-10">
        <AnalysisHistory />
      </div>
    </div>
  )
}
