/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 lucide-react 的图标
 * [OUTPUT]: 对外提供 UploadArea 拖拽上传区组件
 * [POS]: video-analysis 的上传入口，被 video-analysis-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload } from 'lucide-react'

/* ─── Component ──────────────────────────────────────── */

export function UploadArea() {
  const t = useTranslations('videoAnalysis')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    // TODO: 处理文件上传
  }, [])

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
      <button className="mt-4 rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600">
        {t('uploadVideo')}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('uploadHint')}
      </p>
    </div>
  )
}
