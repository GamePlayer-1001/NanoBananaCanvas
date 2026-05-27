/**
 * [INPUT]: 依赖 react 的 useEffect/useRef，依赖 @xyflow/react 的 useStoreApi (零 re-render imperative 订阅)，
 *          依赖外层 Canvas 容器 ref 作为尺寸与鼠标事件宿主
 * [OUTPUT]: 对外提供 EditorParticleField 交互粒子背景组件
 * [POS]: components/canvas 的画布背景渲染层，替代 ReactFlow 默认静态点阵，为真实编辑画布提供随鼠标浮起、加粗、波动的粒子反馈，
 *         点阵以世界坐标为基准随画布缩放/平移整体收放，形成与节点同坐标系的呼吸式底纹
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { useStoreApi } from '@xyflow/react'

interface EditorParticleFieldProps {
  hostRef: RefObject<HTMLDivElement | null>
}

interface PointerState {
  active: boolean
  x: number
  y: number
}

interface CanvasMetrics {
  width: number
  height: number
  dpr: number
}

const WORLD_GAP = 28
const WORLD_RADIUS = 0.75
const MIN_SCREEN_GAP = 14
const MAX_SCREEN_GAP = 200
const FADE_SCREEN_GAP = 20
const MIN_SCREEN_RADIUS = 0.3
const MAX_SCREEN_RADIUS = 4.0
const INTERACTION_RADIUS = 160
const HOVER_EASE_IN = 0.12
const HOVER_EASE_OUT = 0.05
const SETTLE_EPSILON = 0.02

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}

export function EditorParticleField({ hostRef }: EditorParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const scheduleFrameRef = useRef<() => void>(() => {})
  const pointerRef = useRef<PointerState>({ active: false, x: 0, y: 0 })
  const hoverStrengthRef = useRef(0)
  const hoverTargetRef = useRef(0)
  const prefersReducedMotionRef = useRef(false)
  const metricsRef = useRef<CanvasMetrics>({ width: 0, height: 0, dpr: 1 })
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 })
  const storeApi = useStoreApi()

  const syncCanvasMetrics = useCallback(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas || typeof window === 'undefined') {
      return
    }

    const width = host.clientWidth
    const height = host.clientHeight
    const dpr = window.devicePixelRatio || 1
    const nextWidth = Math.max(Math.round(width * dpr), 1)
    const nextHeight = Math.max(Math.round(height * dpr), 1)

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth
      canvas.height = nextHeight
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    metricsRef.current = { width, height, dpr }
  }, [hostRef])

  const draw = useCallback(
    (time: number) => {
      syncCanvasMetrics()

      const canvas = canvasRef.current
      const { width, height, dpr } = metricsRef.current
      if (!canvas || width <= 0 || height <= 0) {
        return false
      }

      const context = canvas.getContext('2d')
      if (!context) {
        return false
      }

      const target = hoverTargetRef.current
      const current = hoverStrengthRef.current
      const easing = target > current ? HOVER_EASE_IN : HOVER_EASE_OUT
      const nextStrength = current + (target - current) * easing
      hoverStrengthRef.current = nextStrength

      const { x: viewportX, y: viewportY, zoom } = viewportRef.current
      const safeZoom = zoom > 0 ? zoom : 1
      const rawScreenGap = WORLD_GAP * safeZoom
      const screenGap = clamp(rawScreenGap, MIN_SCREEN_GAP, MAX_SCREEN_GAP)
      const zoomFade = rawScreenGap <= MIN_SCREEN_GAP ? 0 : rawScreenGap < FADE_SCREEN_GAP ? (rawScreenGap - MIN_SCREEN_GAP) / (FADE_SCREEN_GAP - MIN_SCREEN_GAP) : 1
      const offsetX = ((viewportX % screenGap) + screenGap) % screenGap
      const offsetY = ((viewportY % screenGap) + screenGap) % screenGap
      const baseRadius = clamp(WORLD_RADIUS * safeZoom, MIN_SCREEN_RADIUS, MAX_SCREEN_RADIUS)

      context.save()
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      if (zoomFade > 0.001) {
        for (let screenX = offsetX - screenGap; screenX <= width + screenGap; screenX += screenGap) {
          for (let screenY = offsetY - screenGap; screenY <= height + screenGap; screenY += screenGap) {
            let influence = 0

            if (nextStrength > 0.001) {
              const dx = screenX - pointerRef.current.x
              const dy = screenY - pointerRef.current.y
              const distance = Math.hypot(dx, dy)
              const falloff = 1 - smoothstep(INTERACTION_RADIUS * 0.15, INTERACTION_RADIUS, distance)
              influence = falloff * nextStrength
            }

            const pulse =
              prefersReducedMotionRef.current || influence <= 0
                ? 0
                : Math.sin(time * 0.007 + screenX * 0.045 + screenY * 0.03) * 0.5 + 0.5

            const lift = influence * (3.0 + pulse * 4.2)
            const radius = baseRadius + influence * (1.1 + pulse * 0.8)
            const alpha = (0.09 + influence * 0.35) * zoomFade

            context.beginPath()
            context.fillStyle = `rgba(15, 23, 42, ${alpha})`
            context.arc(screenX, screenY - lift, radius, 0, Math.PI * 2)
            context.fill()
          }
        }
      }

      context.restore()

      return pointerRef.current.active || nextStrength > SETTLE_EPSILON
    },
    [syncCanvasMetrics],
  )

  const scheduleFrame = useCallback(() => {
    if (animationFrameRef.current != null || typeof window === 'undefined') {
      return
    }

    animationFrameRef.current = window.requestAnimationFrame((time) => {
      animationFrameRef.current = null
      const shouldContinue = draw(time)
      if (shouldContinue) {
        scheduleFrameRef.current()
      }
    })
  }, [draw])

  useEffect(() => {
    scheduleFrameRef.current = scheduleFrame
  }, [scheduleFrame])

  /* ── 关键性能：用 store.subscribe 拿 transform，避免每帧 React re-render ── */
  useEffect(() => {
    const initial = storeApi.getState().transform
    viewportRef.current = { x: initial[0], y: initial[1], zoom: initial[2] }
    scheduleFrame()

    const unsubscribe = storeApi.subscribe((state, prev) => {
      const next = state.transform
      const last = prev.transform
      if (next === last) return
      if (next[0] === last[0] && next[1] === last[1] && next[2] === last[2]) return
      viewportRef.current = { x: next[0], y: next[1], zoom: next[2] }
      scheduleFrame()
    })

    return () => unsubscribe()
  }, [scheduleFrame, storeApi])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncReducedMotion = () => {
      prefersReducedMotionRef.current = mediaQuery.matches
      scheduleFrame()
    }

    syncReducedMotion()
    mediaQuery.addEventListener('change', syncReducedMotion)

    return () => mediaQuery.removeEventListener('change', syncReducedMotion)
  }, [scheduleFrame])

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return undefined
    }

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect()
      pointerRef.current = {
        active: true,
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
      hoverTargetRef.current = 1
      scheduleFrame()
    }

    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY)
    }

    const handlePointerLeave = () => {
      pointerRef.current.active = false
      hoverTargetRef.current = 0
      scheduleFrame()
    }

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasMetrics()
      scheduleFrame()
    })

    resizeObserver.observe(host)
    host.addEventListener('pointermove', handlePointerMove)
    host.addEventListener('pointerleave', handlePointerLeave)
    host.addEventListener('pointercancel', handlePointerLeave)

    syncCanvasMetrics()
    scheduleFrame()

    return () => {
      resizeObserver.disconnect()
      host.removeEventListener('pointermove', handlePointerMove)
      host.removeEventListener('pointerleave', handlePointerLeave)
      host.removeEventListener('pointercancel', handlePointerLeave)
    }
  }, [hostRef, scheduleFrame, syncCanvasMetrics])

  useEffect(
    () => () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    },
    [],
  )

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  )
}
