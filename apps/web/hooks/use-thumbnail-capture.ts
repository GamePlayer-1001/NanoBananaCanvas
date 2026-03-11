/**
 * [INPUT]: 依赖 html-to-image 的 toBlob，依赖 react 的 useCallback/useRef
 * [OUTPUT]: 对外提供 useThumbnailCapture hook (画布截图 → 上传 R2 → 更新 workflow.thumbnail)
 * [POS]: hooks 的缩略图生成桥梁，在画布 auto-save 成功后触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef } from 'react'
import { toBlob } from 'html-to-image'

/* ─── Constants ───────────────────────────────────────── */

const THROTTLE_MS = 60_000 // 每 60 秒最多生成一次
const CAPTURE_OPTIONS = {
  quality: 0.8,
  pixelRatio: 0.5, // 降低分辨率，减少体积
  cacheBust: true,
}

/* ─── Hook ────────────────────────────────────────────── */

export function useThumbnailCapture(workflowId?: string) {
  const lastCaptureRef = useRef(0)
  const pendingRef = useRef(false)

  const capture = useCallback(async () => {
    if (!workflowId || pendingRef.current) return
    if (Date.now() - lastCaptureRef.current < THROTTLE_MS) return

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
    } catch {
      /* 截图失败不影响主流程 */
    } finally {
      pendingRef.current = false
    }
  }, [workflowId])

  return { capture }
}
