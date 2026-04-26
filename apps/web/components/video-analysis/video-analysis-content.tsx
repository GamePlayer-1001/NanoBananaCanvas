/**
 * [INPUT]: 依赖 react 的 useState，
 *          依赖 next-intl 的 useTranslations，
 *          依赖 sonner 的 toast，
 *          依赖 @/components/video-analysis/upload-area，
 *          依赖 @/components/video-analysis/model-selector，
 *          依赖 @/components/video-analysis/analysis-history，
 *          依赖 @/components/video-analysis/analysis-result，
 *          依赖 ./video-analysis-prompts 的 VideoAnalysisResult
 * [OUTPUT]: 对外提供 VideoAnalysisContent 客户端交互容器（上传/校验/执行入口/结果展示/本地历史）
 * [POS]: video-analysis 的客户端组合组件，被 page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { UploadArea, type VideoUploadValue } from './upload-area'
import {
  ModelSelector,
  getVideoAnalysisModelLabel,
  type VideoAnalysisModelId,
} from './model-selector'
import { AnalysisHistory, type VideoAnalysisHistoryItem } from './analysis-history'
import { AnalysisResult } from './analysis-result'
import type { VideoAnalysisResult } from './video-analysis-prompts'

/* ─── Component ──────────────────────────────────────── */

export function VideoAnalysisContent() {
  const t = useTranslations('videoAnalysis')
  const [selectedVideo, setSelectedVideo] = useState<VideoUploadValue | null>(null)
  const [model, setModel] = useState<VideoAnalysisModelId>('gemini-2.5-flash-image')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [historyItems, setHistoryItems] = useState<VideoAnalysisHistoryItem[]>([])

  const handleExecute = async () => {
    if (!selectedVideo) return

    const historyId = crypto.randomUUID()
    const createdAtLabel = new Intl.DateTimeFormat(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

    setHistoryItems((current) => [
      {
        id: historyId,
        fileName: selectedVideo.name,
        durationLabel: selectedVideo.durationLabel,
        modelLabel: getVideoAnalysisModelLabel(model),
        createdAtLabel,
        status: 'processing',
      },
      ...current,
    ])

    setIsSubmitting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedVideo.file)
      formData.append('model', model)
      formData.append('durationSeconds', String(selectedVideo.durationSeconds))

      const response = await fetch('/api/video-analysis', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        data?: {
          result: VideoAnalysisResult
        }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.result) {
        throw new Error(payload.error?.message || t('analysisFailed'))
      }

      setResult(payload.data.result)
      setHistoryItems((current) =>
        current.map((item) =>
          item.id === historyId
            ? { ...item, status: 'completed' as const }
            : item,
        ),
      )
      toast.success(t('analysisCompleted'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('analysisFailed')
      setHistoryItems((current) =>
        current.map((item) =>
          item.id === historyId
            ? { ...item, status: 'failed' as const, errorMessage: message }
            : item,
        ),
      )
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      {/* 标题 */}
      <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>

      {/* 上传区域 */}
      <div className="mt-8">
        <UploadArea value={selectedVideo} onChange={setSelectedVideo} />
      </div>

      {/* AI 模型选择 */}
      <div className="mt-6">
        <ModelSelector value={model} onChange={setModel} />
      </div>

      {/* 执行入口 */}
      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">{t('analysisActionTitle')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedVideo
                ? t('analysisReadyDescription', {
                    name: selectedVideo.name,
                    duration: selectedVideo.durationLabel,
                  })
                : t('analysisIdleDescription')}
            </p>
          </div>

          <button
            onClick={() => void handleExecute()}
            disabled={!selectedVideo || isSubmitting}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? t('analysisRunning') : t('runAnalysis')}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-10">
          <AnalysisResult result={result} />
        </div>
      )}

      {/* 分析历史 */}
      <div className="mt-10">
        <AnalysisHistory items={historyItems} />
      </div>
    </div>
  )
}
