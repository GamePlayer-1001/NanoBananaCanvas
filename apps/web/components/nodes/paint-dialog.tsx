/**
 * [INPUT]: 依赖 react，依赖 next-intl 的 useTranslations，依赖 lucide-react 的 Brush/Eraser/RotateCcw/Save/X/Undo2/Redo2，
 *          依赖 @/components/ui/dialog，依赖 @/hooks/use-upload，依赖 @/lib/utils 的 cn
 * [OUTPUT]: 对外提供 PaintDialog 绘画弹窗组件 (尺寸比例切换 + 笔刷粗细 + 色轮选色 + 保存/清除/撤回/前进/关闭)
 * [POS]: components/nodes 的绘画弹窗，被 PaintNode 双击时触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

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
import {
  Brush,
  Eraser,
  Loader2,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  X,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpload } from '@/hooks/use-upload'
import { cn } from '@/lib/utils'

/* ─── Constants ────────────────────────────────────── */

export const PAINT_ASPECT_RATIOS = [
  { id: '9:16', w: 720, h: 1280 },
  { id: '2:3', w: 832, h: 1248 },
  { id: '3:4', w: 960, h: 1280 },
  { id: '1:1', w: 1024, h: 1024 },
  { id: '4:3', w: 1280, h: 960 },
  { id: '3:2', w: 1248, h: 832 },
  { id: '16:9', w: 1280, h: 720 },
] as const

export type PaintAspectRatio = (typeof PAINT_ASPECT_RATIOS)[number]['id']

const MIN_BRUSH = 1
const MAX_BRUSH = 80

const PRESET_COLORS = [
  '#111827',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ffffff',
] as const

type Tool = 'brush' | 'eraser'

interface Stroke {
  tool: Tool
  size: number
  color: string
  points: Array<{ x: number; y: number }>
}

/* ─── Types ────────────────────────────────────────── */

export interface PaintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAspect: PaintAspectRatio
  initialBrushSize: number
  initialBrushColor: string
  onSave: (params: {
    imageUrl: string
    aspectRatio: PaintAspectRatio
    brushSize: number
    brushColor: string
  }) => void
}

/* ─── Cursor builders ──────────────────────────────── */

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

/* ─── Component ────────────────────────────────────── */

export function PaintDialog({
  open,
  onOpenChange,
  initialAspect,
  initialBrushSize,
  initialBrushColor,
  onSave,
}: PaintDialogProps) {
  const t = useTranslations('nodes')
  const { upload, uploading } = useUpload()

  const [aspect, setAspect] = useState<PaintAspectRatio>(initialAspect)
  const [tool, setTool] = useState<Tool>('brush')
  const [brushSize, setBrushSize] = useState<number>(initialBrushSize)
  const [brushColor, setBrushColor] = useState<string>(initialBrushColor)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [saving, setSaving] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const dims = useMemo(() => {
    const found = PAINT_ASPECT_RATIOS.find((r) => r.id === aspect)
    return found ?? PAINT_ASPECT_RATIOS[3]
  }, [aspect])

  /* 弹窗打开时复位状态，以当前节点配置作为起点 */
  useEffect(() => {
    if (!open) return
    setAspect(initialAspect)
    setBrushSize(initialBrushSize)
    setBrushColor(initialBrushColor)
    setStrokes([])
    setRedoStack([])
    setTool('brush')
  }, [open, initialAspect, initialBrushSize, initialBrushColor])

  /* 切换比例时清空，避免旧坐标在新分辨率下错位 */
  const onAspectChange = useCallback((next: PaintAspectRatio) => {
    setAspect(next)
    setStrokes([])
    setRedoStack([])
  }, [])

  /* 渲染 strokes 到 canvas (像素空间) */
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokes) {
      ctx.globalCompositeOperation =
        stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.fillStyle = stroke.color
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
    ctx.globalCompositeOperation = 'source-over'
  }, [strokes, dims])

  /* 屏幕坐标 -> 画布像素坐标 (画布按 contain 适配容器) */
  const toCanvasPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const container = containerRef.current
      if (!container) return null
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
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
    [dims],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const point = toCanvasPoint(event.clientX, event.clientY)
      if (!point) return
      ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
      setIsDrawing(true)
      setStrokes((prev) => [
        ...prev,
        { tool, size: brushSize, color: brushColor, points: [point] },
      ])
      setRedoStack([])
    },
    [brushColor, brushSize, toCanvasPoint, tool],
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

  const onUndo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev
      const next = prev.slice(0, -1)
      const popped = prev[prev.length - 1]
      setRedoStack((stack) => [...stack, popped])
      return next
    })
  }, [])

  const onRedo = useCallback(() => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack
      const next = stack.slice(0, -1)
      const popped = stack[stack.length - 1]
      setStrokes((prev) => [...prev, popped])
      return next
    })
  }, [])

  const onClear = useCallback(() => {
    setStrokes([])
    setRedoStack([])
  }, [])

  const onSubmitSave = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || saving) return
    setSaving(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      )
      if (!blob) {
        setSaving(false)
        return
      }
      const file = new File(
        [blob],
        `paint-${aspect.replace(':', 'x')}-${Date.now()}.png`,
        { type: 'image/png' },
      )
      const result = await upload(file)
      if (result?.url) {
        onSave({ imageUrl: result.url, aspectRatio: aspect, brushSize, brushColor })
        onOpenChange(false)
      }
    } finally {
      setSaving(false)
    }
  }, [aspect, brushColor, brushSize, onOpenChange, onSave, saving, upload])

  const cursorStyle = useMemo(
    () => ({ cursor: tool === 'eraser' ? buildEraserCursor() : buildBrushCursor() }),
    [tool],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[min(96vw,1180px)] gap-3 p-4 sm:p-5"
      >
        <DialogTitle className="sr-only">{t('paintTitle')}</DialogTitle>

        {/* ── Top toolbar ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px]">{t('paintAspect')}</span>
            <div className="border-border bg-muted/40 inline-flex items-center gap-0.5 rounded-md border p-0.5">
              {PAINT_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => onAspectChange(ratio.id)}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] tabular-nums transition-colors',
                    aspect === ratio.id
                      ? 'bg-[var(--brand-500)] text-white'
                      : 'hover:bg-accent',
                  )}
                >
                  {ratio.id}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-border h-6 w-px" />

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
            <Brush size={12} />
            {t('paintBrush')}
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
            <Eraser size={12} />
            {t('paintEraser')}
          </button>

          <div className="text-muted-foreground flex items-center gap-1.5">
            <span className="text-[11px]">{t('paintBrushSize')}</span>
            <input
              type="range"
              min={MIN_BRUSH}
              max={MAX_BRUSH}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="h-1 w-24 accent-[var(--brand-500)]"
            />
            <span className="tabular-nums text-foreground w-6 text-right">{brushSize}</span>
          </div>

          <div className="bg-border h-6 w-px" />

          <div className="text-muted-foreground flex items-center gap-1.5">
            <span className="text-[11px]">{t('paintColor')}</span>
            <label className="relative inline-flex items-center">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label={t('paintColor')}
              />
              <span
                className="border-border block h-7 w-7 rounded-full border shadow-inner"
                style={{ backgroundColor: brushColor }}
              />
            </label>
            <span className="text-foreground tabular-nums font-mono text-[11px] uppercase">
              {brushColor}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrushColor(c)}
                className={cn(
                  'h-5 w-5 rounded-full border transition-transform',
                  brushColor.toLowerCase() === c
                    ? 'scale-110 border-[var(--brand-500)] ring-2 ring-[var(--brand-500)]/40'
                    : 'border-black/15 hover:scale-110',
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {/* ── Canvas area ─────────────────────────────── */}
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
          style={cursorStyle}
          className="bg-muted/30 relative flex h-[64vh] w-full select-none items-center justify-center overflow-hidden rounded-lg border"
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none max-h-full max-w-full bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]"
            style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
          />
        </div>

        {/* ── Bottom toolbar ──────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onUndo}
            disabled={strokes.length === 0}
            className="hover:bg-accent flex items-center gap-1 rounded-md border px-2.5 py-1.5 transition-colors disabled:opacity-40"
          >
            <Undo2 size={12} />
            {t('paintUndo')}
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={redoStack.length === 0}
            className="hover:bg-accent flex items-center gap-1 rounded-md border px-2.5 py-1.5 transition-colors disabled:opacity-40"
          >
            <Redo2 size={12} />
            {t('paintRedo')}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={strokes.length === 0}
            className="hover:bg-accent flex items-center gap-1 rounded-md border px-2.5 py-1.5 transition-colors disabled:opacity-40"
          >
            <RotateCcw size={12} />
            {t('paintClear')}
          </button>

          <span className="text-muted-foreground/80 ml-2 text-[11px] tabular-nums">
            {dims.w} × {dims.h}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="hover:bg-accent flex items-center gap-1 rounded-md border px-2.5 py-1.5 transition-colors"
            >
              <X size={12} />
              {t('paintClose')}
            </button>
            <button
              type="button"
              onClick={onSubmitSave}
              disabled={saving || uploading}
              className="flex items-center gap-1 rounded-md bg-[var(--brand-500)] px-3 py-1.5 text-white transition-colors hover:bg-[var(--brand-500)]/90 disabled:opacity-60"
            >
              {saving || uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              {t('paintSave')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
