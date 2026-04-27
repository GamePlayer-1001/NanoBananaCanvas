/**
 * [INPUT]: 依赖 html-to-image 的 toBlob，依赖 react 的 useCallback/useEffect/useRef，
 *          依赖 @tanstack/react-query 的 useQueryClient，依赖 @/lib/query/keys
 * [OUTPUT]: 对外提供 useThumbnailCapture hook (画布截图 → 上传 R2 → 更新 workflow.thumbnail)
 * [POS]: hooks 的缩略图生成桥梁，在画布 auto-save 成功后触发，负责节流截图与工作区缓存失效
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toBlob } from 'html-to-image'
import { queryKeys } from '@/lib/query/keys'

/* ─── Constants ───────────────────────────────────────── */

const THROTTLE_MS = 15_000 // 每 15 秒最多生成一次，但保留尾触发
const CAPTURE_OPTIONS = {
  quality: 0.8,
  pixelRatio: 0.5, // 降低分辨率，减少体积
  cacheBust: true,
}

/* ─── Hook ────────────────────────────────────────────── */

export function useThumbnailCapture(workflowId?: string) {
  const queryClient = useQueryClient()
  const lastCaptureRef = useRef(0)
  const pendingRef = useRef(false)
  const queuedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performCapture = useCallback(async () => {
    if (!workflowId || pendingRef.current) return
    /* 定位 ReactFlow 视口 DOM */
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
    if (!viewport) return

    pendingRef.current = true

    try {
      const blob = await toBlob(viewport, CAPTURE_OPTIONS)
      if (!blob) return

      /* 上传到专用缩略图端点 */
      const formData = new FormData()
      formData.append('file', blob, 'thumbnail.webp')

      await fetch(`/api/workflows/${workflowId}/thumbnail`, {
        method: 'PUT',
        body: formData,
      })

      lastCaptureRef.current = Date.now()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) }),
      ])
    } catch {
      /* 截图失败不影响主流程 */
    } finally {
      pendingRef.current = false

      if (queuedRef.current) {
        queuedRef.current = false
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        const remaining = Math.max(0, THROTTLE_MS - (Date.now() - lastCaptureRef.current))
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          void performCapture()
        }, remaining)
      }
    }
  }, [queryClient, workflowId])

  const capture = useCallback(() => {
    if (!workflowId) return

    const remaining = THROTTLE_MS - (Date.now() - lastCaptureRef.current)
    if (pendingRef.current) {
      queuedRef.current = true
      return
    }

    if (remaining > 0) {
      queuedRef.current = true
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          queuedRef.current = false
          void performCapture()
        }, remaining)
      }
      return
    }

    void performCapture()
  }, [performCapture, workflowId])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { capture }
}
