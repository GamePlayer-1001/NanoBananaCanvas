/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/hooks/use-upload，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageMaskNode 蒙版输入节点组件
 * [POS]: components/nodes 的笔刷蒙版节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 节点内底图为签名/blob URL，需保留原始 img 行为。 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useTranslations } from 'next-intl'
import { useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { Eraser, Loader2, Pencil, RotateCcw } from 'lucide-react'

import { useFlowStore } from '@/stores/use-flow-store'
import { useUpload } from '@/hooks/use-upload'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

const MIN_BRUSH = 8
const MAX_BRUSH = 96
const DEFAULT_BRUSH = 32
const NODE_MIN_HEIGHT = 320

type Tool = 'brush' | 'eraser'

interface Stroke {
  tool: Tool
  size: number
  points: Array<{ x: number; y: number }>
}

export function ImageMaskNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const updateNodeInternals = useUpdateNodeInternals()
  const t = useTranslations('nodes')
  const { upload, uploading } = useUpload()

  const baseImageUrl = useUpstreamImageUrl(props.id, nodes, edges)
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

  /* ── Upstream image bootstrap ─────────────────────── */
  useEffect(() => {
    if (!baseImageUrl) {
      setImageDims(null)
      imageRef.current = null
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageDims({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
    }
    img.onerror = () => {
      imageRef.current = null
      setImageDims(null)
    }
    img.src = baseImageUrl
  }, [baseImageUrl])

  /* ── Upstream change resets strokes ────────────────── */
  useEffect(() => {
    setStrokes([])
    if (data.config.maskUrl) {
      updateNodeData(props.id, { config: { ...data.config, maskUrl: '' } })
    }
    // 仅依赖底图 url：底图变了就清空蒙版
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseImageUrl])

  /* ── Stable node min-height ────────────────────────── */
  useEffect(() => {
    const currentNode = nodes.find((node) => node.id === props.id)
    const currentHeight = currentNode?.height
    const currentStyleHeight =
      typeof currentNode?.style?.height === 'number' ? currentNode.style.height : undefined
    const effectiveHeight = currentHeight ?? currentStyleHeight

    if (typeof effectiveHeight === 'number' && effectiveHeight >= NODE_MIN_HEIGHT) {
      return
    }

    const nextStyle = {
      ...(currentNode?.style ?? {}),
      height: NODE_MIN_HEIGHT,
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
        writeMaskUrl('')
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
  }, [strokes, imageDims, props.id, upload, writeMaskUrl])

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
      setStrokes((prev) => [
        ...prev,
        { tool, size: brushSize, points: [point] },
      ])
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

  const hasMask = Boolean(maskUrl) && strokes.length > 0
  const showHint = !baseImageUrl

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<Pencil size={14} />}
      minHeight={NODE_MIN_HEIGHT}
      bodyClassName="min-h-0"
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        {showHint ? (
          <div className="text-muted-foreground text-xs">{t('imageMaskHint')}</div>
        ) : null}

        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            'nodrag nowheel relative min-h-0 flex-1 select-none overflow-hidden rounded-lg border',
            baseImageUrl ? 'cursor-crosshair' : 'bg-muted/30',
          )}
        >
          {baseImageUrl ? (
            <img
              src={baseImageUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="text-muted-foreground/70 flex h-full w-full items-center justify-center text-xs">
              {t('imageMaskWaitingForImage')}
            </div>
          )}

          {imageDims ? (
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-60 mix-blend-screen"
            />
          ) : null}

          {uploading ? (
            <div className="bg-background/70 absolute right-1 top-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
              <Loader2 size={10} className="animate-spin" />
              <span>{t('imageMaskUploading')}</span>
            </div>
          ) : null}
        </div>

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
          {hasMask
            ? t('imageMaskReady')
            : strokes.length > 0
              ? t('imageMaskSyncing')
              : t('imageMaskTip')}
        </div>
      </div>
    </BaseNode>
  )
}

/* ─── Helper: read upstream image-out via edges ───────── */

function useUpstreamImageUrl(
  nodeId: string,
  nodes: ReturnType<typeof useFlowStore.getState>['nodes'],
  edges: ReturnType<typeof useFlowStore.getState>['edges'],
): string | undefined {
  const incoming = edges.find(
    (edge) => edge.target === nodeId && edge.targetHandle === 'image-in',
  )
  if (!incoming) return undefined
  const sourceNode = nodes.find((n) => n.id === incoming.source)
  if (!sourceNode) return undefined
  const data = sourceNode.data as WorkflowNodeData | undefined
  const config = data?.config ?? {}
  const direct = typeof config.imageUrl === 'string' ? config.imageUrl : ''
  if (direct) return direct
  const generated = typeof config.resultUrl === 'string' ? config.resultUrl : ''
  if (generated) return generated
  return undefined
}
