/**
 * [INPUT]: 依赖 react 的 useState/useCallback
 * [OUTPUT]: 对外提供 useUpload hook (文件上传 + 进度追踪)
 * [POS]: hooks 的文件上传，被 image-upload 组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useState } from 'react'

/* ─── Types ──────────────────────────────────────────── */

interface UploadResult {
  key: string
  url: string
  size: number
  type: string
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
}

/* ─── Hook ───────────────────────────────────────────── */

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  })

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setState({ uploading: true, progress: 0, error: null })

    try {
      const formData = new FormData()
      formData.append('file', file)

      /* ── XMLHttpRequest for progress tracking ──── */
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setState((prev) => ({ ...prev, progress: Math.round((e.loaded / e.total) * 100) }))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText)
            if (json.ok) {
              resolve(json.data)
            } else {
              reject(new Error(json.error?.message ?? 'Upload failed'))
            }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

        xhr.open('POST', '/api/files/upload')
        xhr.send(formData)
      })

      setState({ uploading: false, progress: 100, error: null })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setState({ uploading: false, progress: 0, error: message })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null })
  }, [])

  return { ...state, upload, reset }
}
