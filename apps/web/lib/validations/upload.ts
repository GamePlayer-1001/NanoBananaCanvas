/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 UPLOAD_LIMITS / validateUpload 文件校验工具
 * [POS]: validations 的上传校验，被 /api/files/upload 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Limits ─────────────────────────────────────────── */

export const UPLOAD_LIMITS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  allowedTypes: new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ]),
} as const

/* ─── Validation ─────────────────────────────────────── */

export function validateUpload(file: File): { ok: true } | { ok: false; reason: string } {
  if (file.size > UPLOAD_LIMITS.maxSizeBytes) {
    const maxMB = UPLOAD_LIMITS.maxSizeBytes / 1024 / 1024
    return { ok: false, reason: `File exceeds ${maxMB}MB limit` }
  }

  if (!UPLOAD_LIMITS.allowedTypes.has(file.type)) {
    return { ok: false, reason: `Unsupported file type: ${file.type}` }
  }

  return { ok: true }
}
