/**
 * [INPUT]: 依赖 react 的 useCallback/useRef/useState，
 *          依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 lucide-react 的图标
 * [OUTPUT]: 对外提供 UploadArea 拖拽上传区组件 (含视频预览 + 文件时长校验)
 * [POS]: video-analysis 的上传入口，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

/* ─── Constants ──────────────────────────────────────────── */

const MAX_FILE_SIZE = 2048 * 1024 * 1024 // 2048 MB
const MAX_DURATION_SECONDS = 600

/* ─── Types ──────────────────────────────────────────────── */

export interface VideoUploadValue {
  file: File
  url: string
  name: string
  sizeLabel: string
  durationSeconds: number
  durationLabel: string
}

/* ─── Helpers ────────────────────────────────────────────── */

function formatDurationLabel(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration)
      URL.revokeObjectURL(url)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('VIDEO_METADATA_FAILED'))
    }

    video.src = url
  })
}

/* ─── Component ──────────────────────────────────────────── */

export function UploadArea({
  value,
  onChange,
}: {
  value: VideoUploadValue | null
  onChange: (value: VideoUploadValue | null) => void
}) {
  const t = useTranslations('videoAnalysis')
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isReading, setIsReading] = useState(false)

  /* ── 文件处理 ──────────────────────────────────────── */
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error(t('onlyVideo'))
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('fileTooLarge'))
      return
    }

    setIsReading(true)

    try {
      const durationSeconds = await getVideoDuration(file)
      if (durationSeconds > MAX_DURATION_SECONDS) {
        toast.error(t('durationTooLong'))
        return
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const url = URL.createObjectURL(file)

      if (value) {
        URL.revokeObjectURL(value.url)
      }

      onChange({
        file,
        url,
        name: file.name,
        sizeLabel: `${sizeMB} MB`,
        durationSeconds,
        durationLabel: formatDurationLabel(durationSeconds),
      })
    } catch {
      toast.error(t('metadataFailed'))
    } finally {
      setIsReading(false)
    }
  }, [onChange, t, value])

  const clearPreview = useCallback(() => {
    if (value) URL.revokeObjectURL(value.url)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onChange, value])

  /* ── 拖拽 ──────────────────────────────────────────── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [handleFile])

  /* ── 选择文件 ──────────────────────────────────────── */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }, [handleFile])

  /* ── 预览状态 ──────────────────────────────────────── */
  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border">
        <div className="relative aspect-video bg-black">
          <video
            src={value.url}
            controls
            className="h-full w-full object-contain"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {value.sizeLabel} · {t('durationValue', { duration: value.durationLabel })}
            </p>
          </div>
          <button
            onClick={clearPreview}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  /* ── 上传区 ────────────────────────────────────────── */
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition-colors ${
        isDragOver
          ? 'border-brand-500 bg-brand-50/50'
          : 'border-border bg-muted/30 hover:border-brand-300 hover:bg-muted/50'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
        <Upload size={20} className="text-brand-500" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={isReading}
        className="mt-4 rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        {isReading ? t('readingVideo') : t('uploadVideo')}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('uploadHint')}
      </p>
    </div>
  )
}
