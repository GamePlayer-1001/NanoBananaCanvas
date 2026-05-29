/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations，依赖 @/lib/billing/workflow-execution-guard 的文本上限常量，
 *          依赖 @dnd-kit/core + @dnd-kit/sortable 实现媒体拖拽排序，依赖 @/hooks/use-upload 上传文件
 * [OUTPUT]: 对外提供 InputNode 统一输入节点组件 (文本+媒体合一)
 * [POS]: components/nodes 的统一输入节点，合并原 text-input + image-input，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 上传预览可能是 blob/data/签名 URL，需要保留原始 img 行为。 */

import { useCallback, useRef, useState, useEffect, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { CircleArrowRight, Paperclip, X, Loader2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { TEXT_INPUT_MAX_LENGTH } from '@/lib/billing/workflow-execution-guard'
import { useUpload } from '@/hooks/use-upload'
import { validateUpload } from '@/lib/validations/upload'
import { BaseNode } from './base-node'

/* ─── Types ───────────────────────────────────────────── */

export interface MediaFile {
  id: string
  url: string
  type: 'image' | 'video'
  name?: string
}

/* ─── Sortable Thumbnail ──────────────────────────────── */

function SortableMediaThumb({
  file,
  onRemove,
}: {
  file: MediaFile
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="nodrag nowheel group/thumb relative h-12 w-12 flex-shrink-0 cursor-grab overflow-hidden rounded-md border border-border active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      {file.type === 'video' ? (
        <video
          src={file.url}
          className="h-full w-full object-cover"
          muted
          preload="metadata"
        />
      ) : (
        <img
          src={file.url}
          alt={file.name ?? ''}
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(file.id)
        }}
        className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover/thumb:opacity-100"
      >
        <X size={10} />
      </button>
    </div>
  )
}

/* ─── Component ───────────────────────────────────────── */

export function InputNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploading, progress, upload, reset: resetUpload } = useUpload()
  const [dragOver, setDragOver] = useState(false)
  const uploadQueueRef = useRef<File[]>([])
  const isProcessingRef = useRef(false)

  /* ── Derived state ─────────────────────────────────── */
  const textValue = (data.config.text as string) ?? ''
  const remaining = TEXT_INPUT_MAX_LENGTH - textValue.length

  const rawMedia = data.config.mediaFiles
  const mediaFiles: MediaFile[] = Array.isArray(rawMedia) ? (rawMedia as MediaFile[]) : []

  /* backward compat: migrate legacy imageUrl into mediaFiles */
  const legacyImageUrl = data.config.imageUrl as string | undefined
  useEffect(() => {
    if (legacyImageUrl && mediaFiles.length === 0) {
      const migrated: MediaFile[] = [
        { id: crypto.randomUUID(), url: legacyImageUrl, type: 'image' },
      ]
      updateNodeData(props.id, {
        config: { ...data.config, mediaFiles: migrated, imageUrl: '' },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyImageUrl])

  /* ── Text change ───────────────────────────────────── */
  const onTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(props.id, {
        config: { ...data.config, text: e.target.value.slice(0, TEXT_INPUT_MAX_LENGTH) },
      })
    },
    [props.id, data.config, updateNodeData],
  )

  /* ── Media upload (sequential queue for multi-file) ── */
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    while (uploadQueueRef.current.length > 0) {
      const file = uploadQueueRef.current.shift()!
      const check = validateUpload(file)
      if (!check.ok) continue

      const result = await upload(file)
      if (result) {
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'
        const newMedia: MediaFile = {
          id: crypto.randomUUID(),
          url: result.url,
          type: fileType as 'image' | 'video',
          name: file.name,
        }
        // Read latest state from store to avoid stale closure
        const latestNodes = useFlowStore.getState().nodes
        const latestNode = latestNodes.find((n) => n.id === props.id)
        const latestConfig = (latestNode?.data as WorkflowNodeData | undefined)?.config ?? {}
        const current = Array.isArray(latestConfig.mediaFiles)
          ? (latestConfig.mediaFiles as MediaFile[])
          : []
        updateNodeData(props.id, {
          config: { ...latestConfig, mediaFiles: [...current, newMedia] },
        })
      }
    }

    isProcessingRef.current = false
    resetUpload()
  }, [upload, resetUpload, props.id, updateNodeData])

  const enqueueFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files)
      uploadQueueRef.current.push(...arr)
      processQueue()
    },
    [processQueue],
  )

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      enqueueFiles(files)
      e.target.value = ''
    },
    [enqueueFiles],
  )

  const onMediaDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        enqueueFiles(e.dataTransfer.files)
      }
    },
    [enqueueFiles],
  )

  /* ── Remove media ──────────────────────────────────── */
  const removeMedia = useCallback(
    (id: string) => {
      const current = Array.isArray(data.config.mediaFiles)
        ? (data.config.mediaFiles as MediaFile[])
        : []
      updateNodeData(props.id, {
        config: { ...data.config, mediaFiles: current.filter((f) => f.id !== id) },
      })
    },
    [props.id, data.config, updateNodeData],
  )

  /* ── DnD sort ──────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const current = Array.isArray(data.config.mediaFiles)
        ? (data.config.mediaFiles as MediaFile[])
        : []
      const oldIndex = current.findIndex((f) => f.id === active.id)
      const newIndex = current.findIndex((f) => f.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const sorted = arrayMove(current, oldIndex, newIndex)
      updateNodeData(props.id, {
        config: { ...data.config, mediaFiles: sorted },
      })
    },
    [props.id, data.config, updateNodeData],
  )

  /* ── 媒体网格状态 ── */
  const hasMedia = mediaFiles.length > 0

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<CircleArrowRight size={14} />}
      minWidth={290}
      minHeight={240}
      heightMode="content"
      bodyClassName="gap-2 pb-3"
    >
      {/* ── Textarea ───────────────────────────────────── */}
      <textarea
        value={textValue}
        onChange={onTextChange}
        placeholder={t('inputPlaceholder')}
        rows={3}
        maxLength={TEXT_INPUT_MAX_LENGTH}
        className="nodrag nowheel border-input bg-background w-full min-h-[96px] grow shrink-0 resize-none rounded-md border px-2 py-1.5 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none"
      />

      {/* ── Media grid + upload button ────────────────── */}
      <div
        className="nodrag nowheel flex flex-col gap-1.5"
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onMediaDrop}
      >
        {hasMedia ? (
          /* 九宫格：缩略图 + 末位方形图标上传按钮，flex-wrap 自动换行 */
          <div className="flex flex-wrap gap-1.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mediaFiles.map((f) => f.id)}
                strategy={rectSortingStrategy}
              >
                {mediaFiles.map((file) => (
                  <SortableMediaThumb
                    key={file.id}
                    file={file}
                    onRemove={removeMedia}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border-2 border-dashed transition-colors ${
                dragOver
                  ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/5 text-[var(--brand-500)]'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground/70'
              }`}
              title={t('inputMedia')}
              aria-label={t('inputMedia')}
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Paperclip size={16} />
              )}
            </button>
          </div>
        ) : (
          /* 空状态：整行虚线大按钮带文案 */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex h-12 w-full items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-2 py-2 text-xs transition-colors ${
              dragOver
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/5'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
            title={t('inputMedia')}
            aria-label={t('inputMedia')}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span>{progress}%</span>
              </>
            ) : (
              <>
                <Paperclip size={14} className="shrink-0" />
                <span>{t('inputMedia')}</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          multiple
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      {/* ── Text counter ───────────────────────────────── */}
      <div className="text-muted-foreground text-right text-[11px] leading-none">
        {t('textLengthCounter', { current: textValue.length, max: TEXT_INPUT_MAX_LENGTH })}
        {remaining <= 20 ? ` · ${t('textLengthRemaining', { count: remaining })}` : ''}
      </div>
    </BaseNode>
  )
}
