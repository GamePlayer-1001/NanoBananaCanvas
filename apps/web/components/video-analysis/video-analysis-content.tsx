/**
 * [INPUT]: 依赖 react 的 useCallback/useEffect/useState，
 *          依赖 next-intl 的 useTranslations，
 *          依赖 sonner 的 toast，
 *          依赖 @/components/video-analysis/upload-area，
 *          依赖 @/components/video-analysis/model-selector，
 *          依赖 @/components/video-analysis/analysis-history，
 *          依赖 @/components/video-analysis/analysis-result，
 *          依赖 ./video-analysis-prompts 的 VideoAnalysisResult
 * [OUTPUT]: 对外提供 VideoAnalysisContent 客户端交互容器（上传/校验/执行入口/结果展示/账号历史）
 * [POS]: video-analysis 的客户端组合组件，被 page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
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

interface VideoAnalysisHistoryApiItem {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  durationSeconds: number
  model: VideoAnalysisModelId
  status: 'processing' | 'completed' | 'failed'
  errorMessage?: string | null
  result?: VideoAnalysisResult | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

interface VideoAnalysisHistoryViewItem extends VideoAnalysisHistoryItem {
  result?: VideoAnalysisResult | null
}

/* ─── Component ──────────────────────────────────────── */

export function VideoAnalysisContent() {
  const t = useTranslations('videoAnalysis')
  const [selectedVideo, setSelectedVideo] = useState<VideoUploadValue | null>(null)
  const [model, setModel] = useState<VideoAnalysisModelId>('gemini-2.5-flash-image')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [historyItems, setHistoryItems] = useState<VideoAnalysisHistoryViewItem[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  function formatHistoryItem(item: VideoAnalysisHistoryApiItem): VideoAnalysisHistoryViewItem {
    const createdAtLabel = new Intl.DateTimeFormat(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(item.createdAt))

    const minutes = Math.floor(item.durationSeconds / 60)
    const seconds = Math.round(item.durationSeconds % 60)
    const durationLabel = `${minutes}:${String(seconds).padStart(2, '0')}`

    return {
      id: item.id,
      fileName: item.fileName,
      durationSeconds: item.durationSeconds,
      durationLabel,
      model: item.model,
      modelLabel: getVideoAnalysisModelLabel(item.model),
      createdAtLabel,
      status: item.status,
      errorMessage: item.errorMessage ?? undefined,
      result: item.result ?? null,
    }
  }

  const loadHistory = useCallback(
    async (preferredHistoryId?: string | null, options?: { silent?: boolean }) => {
      setIsHistoryLoading(true)

      try {
        const response = await fetch('/api/video-analysis', { method: 'GET' })
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean
          data?: { items?: VideoAnalysisHistoryApiItem[] }
          error?: { message?: string }
        }

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error?.message || t('historyLoadFailed'))
        }

        const items = (payload.data?.items ?? []).map(formatHistoryItem)
        setHistoryItems(items)

        const nextSelectedId =
          preferredHistoryId && items.some((item) => item.id === preferredHistoryId)
            ? preferredHistoryId
            : items.find((item) => item.status === 'completed')?.id ?? items[0]?.id ?? null

        setSelectedHistoryId(nextSelectedId)

        const selectedItem = items.find((item) => item.id === nextSelectedId)
        setResult(selectedItem?.result ?? null)
      } catch (error) {
        const message = error instanceof Error ? error.message : t('historyLoadFailed')
        if (!options?.silent) {
          toast.error(message)
        }
      } finally {
        setIsHistoryLoading(false)
      }
    },
    [t],
  )

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const handleExecute = async () => {
    if (!selectedVideo) return

    const historyId = `pending_${crypto.randomUUID()}`
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
        durationSeconds: selectedVideo.durationSeconds,
        durationLabel: selectedVideo.durationLabel,
        model,
        modelLabel: getVideoAnalysisModelLabel(model),
        createdAtLabel,
        status: 'processing',
      },
      ...current,
    ])
    setSelectedHistoryId(historyId)

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
          historyItem?: VideoAnalysisHistoryApiItem | null
        }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.result) {
        throw new Error(payload.error?.message || t('analysisFailed'))
      }

      setResult(payload.data.result)
      await loadHistory(payload.data.historyItem?.id ?? null)
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
      await loadHistory(undefined, { silent: true })
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleHistorySelect(item: VideoAnalysisHistoryViewItem) {
    setSelectedHistoryId(item.id)
    setResult(item.result ?? null)
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
        {isHistoryLoading ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            {t('historyLoading')}
          </div>
        ) : (
          <AnalysisHistory
            items={historyItems}
            selectedId={selectedHistoryId}
            onSelect={handleHistorySelect}
          />
        )}
      </div>
    </div>
  )
}
