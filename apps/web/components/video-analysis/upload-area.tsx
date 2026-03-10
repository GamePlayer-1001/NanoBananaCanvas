/**
 * [INPUT]: 依赖 react 的 useCallback/useRef/useState，
 *          依赖 next-intl 的 useTranslations，依赖 lucide-react 的图标
 * [OUTPUT]: 对外提供 UploadArea 拖拽上传区组件 (含图片预览)
 * [POS]: video-analysis 的上传入口，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, X } from 'lucide-react'

/* ─── Constants ──────────────────────────────────────────── */

const MAX_FILE_SIZE = 2048 * 1024 * 1024 // 2048 MB

/* ─── Component ──────────────────────────────────────────── */

export function UploadArea() {
  const t = useTranslations('videoAnalysis')
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<{ url: string; name: string; size: string } | null>(null)

  /* ── 文件处理 ──────────────────────────────────────── */
  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large: ${(file.size / (1024 * 1024)).toFixed(0)} MB (max 2048 MB)`)
      return
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    const url = URL.createObjectURL(file)
    setPreview({ url, name: file.name, size: `${sizeMB} MB` })
  }, [])

  const clearPreview = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [preview])

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
    if (file) handleFile(file)
  }, [handleFile])

  /* ── 选择文件 ──────────────────────────────────────── */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  /* ── 预览状态 ──────────────────────────────────────── */
  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border">
        <div className="relative aspect-video bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.name}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{preview.name}</p>
            <p className="text-xs text-muted-foreground">{preview.size}</p>
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
        accept="image/*,video/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        {t('uploadVideo')}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('uploadHint')}
      </p>
    </div>
  )
}
