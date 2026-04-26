/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 SHARE_UPLOAD_ACCEPT / UPLOAD_LIMITS / detectUploadKind / validateUpload 文件校验工具
 * [POS]: validations 的上传校验，被 /api/files/upload 与 explore 分享入口消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Limits ─────────────────────────────────────────── */

const MB = 1024 * 1024

export const UPLOAD_LIMITS = {
  imageMaxSizeBytes: 10 * MB,
  videoMaxSizeBytes: 512 * MB,
  workflowMaxSizeBytes: 5 * MB,
  videoMaxDurationSeconds: 600,
  imageTypes: new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ]),
  videoTypes: new Set([
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v',
    'video/mpeg',
  ]),
  workflowTypes: new Set([
    'application/json',
    'text/json',
  ]),
  workflowExtensions: new Set(['json']),
} as const

export const SHARE_UPLOAD_ACCEPT = 'image/*,video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg,.json'

/* ─── Validation ─────────────────────────────────────── */

export type UploadKind = 'image' | 'video' | 'workflow'

export function detectUploadKind(file: Pick<File, 'name' | 'type'>): UploadKind | null {
  if (UPLOAD_LIMITS.imageTypes.has(file.type)) return 'image'
  if (UPLOAD_LIMITS.videoTypes.has(file.type)) return 'video'
  if (UPLOAD_LIMITS.workflowTypes.has(file.type)) return 'workflow'

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && UPLOAD_LIMITS.workflowExtensions.has(ext)) return 'workflow'

  return null
}

export function validateUpload(file: File): { ok: true; kind: UploadKind } | { ok: false; reason: string } {
  const kind = detectUploadKind(file)
  if (!kind) {
    return { ok: false, reason: `Unsupported file type: ${file.type || file.name}` }
  }

  if (kind === 'image' && file.size > UPLOAD_LIMITS.imageMaxSizeBytes) {
    return { ok: false, reason: `File exceeds ${UPLOAD_LIMITS.imageMaxSizeBytes / MB}MB limit` }
  }

  if (kind === 'video' && file.size > UPLOAD_LIMITS.videoMaxSizeBytes) {
    return { ok: false, reason: `File exceeds ${UPLOAD_LIMITS.videoMaxSizeBytes / MB}MB limit` }
  }

  if (kind === 'workflow' && file.size > UPLOAD_LIMITS.workflowMaxSizeBytes) {
    return { ok: false, reason: `File exceeds ${UPLOAD_LIMITS.workflowMaxSizeBytes / MB}MB limit` }
  }

  return { ok: true, kind }
}
