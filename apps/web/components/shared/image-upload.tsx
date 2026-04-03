/**
 * [INPUT]: 依赖 @/hooks/use-upload 的 useUpload，依赖 @/lib/validations/upload 的 validateUpload，
 *          依赖 next-intl 的 useTranslations，依赖 lucide-react
 * [OUTPUT]: 对外提供 ImageUpload 拖拽上传组件
 * [POS]: shared 的可复用上传组件，被 publish-dialog 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 上传预览可能是 blob/data/签名 URL，需要保留原始 img 行为。 */

import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useTranslations } from 'next-intl'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useUpload } from '@/hooks/use-upload'
import { validateUpload } from '@/lib/validations/upload'

/* ─── Types ──────────────────────────────────────────── */

interface ImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  className?: string
}

/* ─── Component ──────────────────────────────────────── */

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const t = useTranslations('upload')
  const { uploading, progress, error, upload, reset } = useUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  /* ── Handle file selection ─────────────────────── */
  const handleFile = useCallback(
    async (file: File) => {
      const check = validateUpload(file)
      if (!check.ok) {
        reset()
        return
      }

      const result = await upload(file)
      if (result) {
        onChange(result.url)
      }
    },
    [upload, onChange, reset],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile],
  )

  /* ── Drag & drop handlers ──────────────────────── */
  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onRemove = useCallback(() => {
    onChange(undefined)
    reset()
  }, [onChange, reset])

  /* ── Render ────────────────────────────────────── */
  if (value) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-border ${className ?? ''}`}>
        <img src={value} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
        dragOver
          ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/5'
          : 'border-border hover:border-foreground/30'
      } ${className ?? ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {uploading ? (
        <>
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </>
      ) : (
        <>
          <ImagePlus size={24} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('dragOrClick')}</span>
          <span className="text-[10px] text-muted-foreground/60">{t('maxSize')}</span>
        </>
      )}

      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
