/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/components/shared/image-upload，
 *          依赖 @/stores/use-flow-store，依赖 @/hooks/use-upload，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageMaskNode 自包含蒙版输入节点组件 (节点内上传 + 单一 image-out 同时承载原图与蒙版)
 * [POS]: components/nodes 的笔刷蒙版节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 节点内底图为签名/blob URL，需保留原始 img 行为。 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useTranslations } from 'next-intl'
import { useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { Eraser, Loader2, Pencil, RotateCcw } from 'lucide-react'

import { ImageUpload } from '@/components/shared/image-upload'
import { useFlowStore } from '@/stores/use-flow-store'
import { useUpload } from '@/hooks/use-upload'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

const MIN_BRUSH = 8
const MAX_BRUSH = 96
const DEFAULT_BRUSH = 32
const NODE_MIN_HEIGHT = 420
const NODE_MIN_WIDTH = 360

type Tool = 'brush' | 'eraser'

interface Stroke {
  tool: Tool
  size: number
  points: Array<{ x: number; y: number }>
}

/* ── Inline SVG cursors for brush/eraser ──────────────── */
function buildBrushCursor(): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>
    <g fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M5 23l5-1 13-13-4-4L6 18z' fill='white'/>
      <path d='M16 6l4 4'/>
      <path d='M5 23l5-1'/>
    </g>
  </svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 4 24, crosshair`
}

function buildEraserCursor(): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>
    <g fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M4 22h12' />
      <path d='M14 6l8 8-8 8H7l-3-3 10-10z' fill='white'/>
      <path d='M11 9l8 8'/>
    </g>
  </svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 4 24, crosshair`
}

export function ImageMaskNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const nodes = useFlowStore((s) => s.nodes)
  const updateNodeInternals = useUpdateNodeInternals()
  const t = useTranslations('nodes')
  const { upload, uploading } = useUpload()

  const imageUrl = (data.config.imageUrl as string | undefined) ?? ''
  const brushSize = (data.config.brushSize as number | undefined) ?? DEFAULT_BRUSH
  const maskUrl = (data.config.maskUrl as string | undefined) ?? ''

  const [tool, setTool] = useState<Tool>('brush')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUploadedKeyRef = useRef<string>('')

  const setBrushSize = useCallback(
    (size: number) => {
      const clamped = Math.max(MIN_BRUSH, Math.min(MAX_BRUSH, Math.round(size)))
      updateNodeData(props.id, {
        config: { ...data.config, brushSize: clamped },
      })
    },
    [data.config, props.id, updateNodeData],
  )

  const writeMaskUrl = useCallback(
    (url: string) => {
      updateNodeData(props.id, {
        config: { ...data.config, maskUrl: url },
      })
    },
    [data.config, props.id, updateNodeData],
  )

  const onImageChange = useCallback(
    (url: string | undefined) => {
      updateNodeData(props.id, {
        config: { ...data.config, imageUrl: url ?? '', maskUrl: '' },
      })
    },
    [data.config, props.id, updateNodeData],
  )

  /* ── Image bootstrap (self-contained url) ─────────── */
  useEffect(() => {
    let cancelled = false
    if (!imageUrl) {
      imageRef.current = null
      lastUploadedKeyRef.current = ''
      const rafId = requestAnimationFrame(() => {
        if (cancelled) return
        setImageDims(null)
        setStrokes([])
      })
      return () => {
        cancelled = true
        cancelAnimationFrame(rafId)
      }
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      imageRef.current = img
      lastUploadedKeyRef.current = ''
      setImageDims({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
      setStrokes([])
    }
    img.onerror = () => {
      if (cancelled) return
      imageRef.current = null
      lastUploadedKeyRef.current = ''
      setImageDims(null)
      setStrokes([])
    }
    img.src = imageUrl
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  /* ── Stable node min size ───────────────────────────── */
  useEffect(() => {
    const currentNode = nodes.find((node) => node.id === props.id)
    const currentHeight = currentNode?.height
    const currentStyleHeight =
      typeof currentNode?.style?.height === 'number' ? currentNode.style.height : undefined
    const currentWidth = currentNode?.width
    const currentStyleWidth =
      typeof currentNode?.style?.width === 'number' ? currentNode.style.width : undefined
    const effectiveHeight = currentHeight ?? currentStyleHeight
    const effectiveWidth = currentWidth ?? currentStyleWidth

    const heightOk =
      typeof effectiveHeight === 'number' && effectiveHeight >= NODE_MIN_HEIGHT
    const widthOk = typeof effectiveWidth === 'number' && effectiveWidth >= NODE_MIN_WIDTH
    if (heightOk && widthOk) {
      return
    }

    const nextStyle = {
      ...(currentNode?.style ?? {}),
      height: heightOk ? (effectiveHeight as number) : NODE_MIN_HEIGHT,
      width: widthOk ? (effectiveWidth as number) : NODE_MIN_WIDTH,
    }

    useFlowStore.setState((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === props.id ? { ...node, style: nextStyle } : node,
      ),
    }))

    const rafId = requestAnimationFrame(() => updateNodeInternals(props.id))
    return () => cancelAnimationFrame(rafId)
  }, [nodes, props.id, updateNodeInternals])

  /* ── Render strokes onto canvas in image pixel space ── */
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageDims) return
    canvas.width = imageDims.w
    canvas.height = imageDims.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokes) {
      ctx.globalCompositeOperation =
        stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = '#ffffff'
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = stroke.size
      if (stroke.points.length === 0) continue
      if (stroke.points.length === 1) {
        const p = stroke.points[0]
        ctx.beginPath()
        ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }
  }, [strokes, imageDims])

  /* ── Debounced mask upload ─────────────────────────── */
  useEffect(() => {
    if (!imageDims) return
    if (strokes.length === 0) {
      if (lastUploadedKeyRef.current !== '') {
        lastUploadedKeyRef.current = ''
        if (maskUrl) writeMaskUrl('')
      }
      return
    }
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    uploadTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const fingerprint = `${strokes.length}-${blob.size}`
        if (fingerprint === lastUploadedKeyRef.current) return
        const file = new File([blob], `mask-${props.id}-${Date.now()}.png`, {
          type: 'image/png',
        })
        const result = await upload(file)
        if (result?.url) {
          lastUploadedKeyRef.current = fingerprint
          writeMaskUrl(result.url)
        }
      }, 'image/png')
    }, 350)

    return () => {
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    }
  }, [strokes, imageDims, props.id, upload, writeMaskUrl, maskUrl])

  /* ── Pointer handlers (translate to image-pixel coords) */
  const toCanvasPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const container = containerRef.current
      const dims = imageDims
      if (!container || !dims) return null
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      // 底图按 contain 渲染，需要重建实际可绘制区域以保持坐标精确
      const scale = Math.min(rect.width / dims.w, rect.height / dims.h)
      const drawW = dims.w * scale
      const drawH = dims.h * scale
      const offsetX = (rect.width - drawW) / 2
      const offsetY = (rect.height - drawH) / 2
      const localX = clientX - rect.left - offsetX
      const localY = clientY - rect.top - offsetY
      if (localX < 0 || localY < 0 || localX > drawW || localY > drawH) return null
      return { x: localX / scale, y: localY / scale }
    },
    [imageDims],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!imageDims) return
      event.preventDefault()
      event.stopPropagation()
      const point = toCanvasPoint(event.clientX, event.clientY)
      if (!point) return
      ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
      setIsDrawing(true)
      setStrokes((prev) => [...prev, { tool, size: brushSize, points: [point] }])
    },
    [brushSize, imageDims, toCanvasPoint, tool],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDrawing) return
      const point = toCanvasPoint(event.clientX, event.clientY)
      if (!point) return
      setStrokes((prev) => {
        if (prev.length === 0) return prev
        const next = prev.slice()
        const last = next[next.length - 1]
        next[next.length - 1] = {
          ...last,
          points: [...last.points, point],
        }
        return next
      })
    },
    [isDrawing, toCanvasPoint],
  )

  const onPointerUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const onClear = useCallback(() => {
    setStrokes([])
  }, [])

  const onUndoLast = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1))
  }, [])

  const cursorStyle = useMemo(
    () => ({ cursor: tool === 'eraser' ? buildEraserCursor() : buildBrushCursor() }),
    [tool],
  )

  const hasMask = Boolean(maskUrl) && strokes.length > 0
  const showHint = !imageUrl

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<Pencil size={14} />}
      minHeight={NODE_MIN_HEIGHT}
      bodyClassName="min-h-0"
    >
      <div className="flex h-full min-h-0 flex-col gap-2.5">
        {showHint ? (
          <div className="text-muted-foreground text-xs">{t('imageMaskHint')}</div>
        ) : null}

        {imageUrl ? (
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={cursorStyle}
            className={cn(
              'nodrag nowheel relative min-h-0 flex-1 select-none overflow-hidden rounded-lg border',
            )}
          >
            <img
              src={imageUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />

            {imageDims ? (
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-60 mix-blend-screen"
              />
            ) : null}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onImageChange(undefined)
              }}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] text-white transition-colors hover:bg-black/75"
            >
              {t('imageMaskReplace')}
            </button>

            {uploading ? (
              <div className="bg-background/70 absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
                <Loader2 size={10} className="animate-spin" />
                <span>{t('imageMaskUploading')}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="nodrag min-h-0 flex-1 overflow-hidden rounded-lg">
            <ImageUpload
              value={undefined}
              onChange={onImageChange}
              className="h-full w-full"
            />
          </div>
        )}

        <div className="nodrag flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setTool('brush')}
            className={cn(
              'flex items-center gap-1 rounded-md border px-2 py-1 transition-colors',
              tool === 'brush'
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10 text-[var(--brand-500)]'
                : 'hover:bg-accent',
            )}
          >
            <Pencil size={11} />
            {t('imageMaskBrush')}
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={cn(
              'flex items-center gap-1 rounded-md border px-2 py-1 transition-colors',
              tool === 'eraser'
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10 text-[var(--brand-500)]'
                : 'hover:bg-accent',
            )}
          >
            <Eraser size={11} />
            {t('imageMaskEraser')}
          </button>

          <div className="text-muted-foreground ml-1 flex items-center gap-1">
            <span>{t('imageMaskBrushSize')}</span>
            <input
              type="range"
              min={MIN_BRUSH}
              max={MAX_BRUSH}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="nodrag nowheel h-1 w-16 accent-[var(--brand-500)]"
            />
            <span className="tabular-nums">{brushSize}</span>
          </div>

          <button
            type="button"
            onClick={onUndoLast}
            disabled={strokes.length === 0}
            className="hover:bg-accent ml-auto rounded-md border px-2 py-1 transition-colors disabled:opacity-40"
          >
            {t('imageMaskUndo')}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={strokes.length === 0}
            className="hover:bg-accent flex items-center gap-1 rounded-md border px-2 py-1 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={11} />
            {t('imageMaskClear')}
          </button>
        </div>

        <div className="text-muted-foreground/80 text-[10px]">
          {!imageUrl
            ? t('imageMaskWaitingForImage')
            : hasMask
              ? t('imageMaskReady')
              : strokes.length > 0
                ? t('imageMaskSyncing')
                : t('imageMaskTip')}
        </div>
      </div>
    </BaseNode>
  )
}
