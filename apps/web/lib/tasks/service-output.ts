/**
 * [INPUT]: 依赖 @/lib/storage 的 extractR2KeyFromFileUrl/generateOutputPath/toPublicFileUrl/toInternalFileUrl,
 *          依赖 @/lib/tasks/processors 的 TaskOutput,
 *          依赖 @/lib/tasks/service-types 的 MediaDimensions/TaskServiceRuntime
 * [OUTPUT]: 对外提供任务输出持久化与媒体类型推断工具
 * [POS]: lib/tasks 的输出处理子模块，从 service.ts 拆出的输出持久化与媒体检测逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  extractR2KeyFromFileUrl,
  generateOutputPath,
  toPublicFileUrl,
  toInternalFileUrl,
} from '@/lib/storage'

import type { TaskOutput } from './processors'
import type { MediaDimensions, TaskServiceRuntime } from './service-types'

/* ─── Content Type → Extension ─────────────────────── */

export const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

export function isUrlOutput(output: TaskOutput | undefined): output is TaskOutput & { url: string } {
  return output?.type === 'url' && typeof output.url === 'string' && output.url.trim().length > 0
}

export function inferExtensionFromContentType(contentType: string | null | undefined): string | null {
  if (!contentType) {
    return null
  }

  const normalized = contentType.split(';', 1)[0]?.trim().toLowerCase()
  return normalized ? CONTENT_TYPE_EXTENSION_MAP[normalized] ?? null : null
}

export function inferExtensionFromUrl(url: string): string | null {
  if (url.startsWith('data:')) {
    const match = /^data:([^;,]+)/i.exec(url)
    return inferExtensionFromContentType(match?.[1] ?? null)
  }

  try {
    const parsed = new URL(url)
    const match = /\.([a-z0-9]+)$/i.exec(parsed.pathname)
    return match?.[1]?.toLowerCase() ?? null
  } catch {
    return null
  }
}

export function inferOutputExtension(output: TaskOutput): string {
  return (
    inferExtensionFromContentType(output.contentType) ??
    (output.url ? inferExtensionFromUrl(output.url) : null) ??
    'bin'
  )
}

export function inferOutputFileName(taskId: string, output: TaskOutput): string {
  const ext = inferOutputExtension(output)
  return `${taskId}.${ext}`
}

/* ─── Image Dimension Detection ───────────────────── */

export function readPngDimensions(bytes: Uint8Array): MediaDimensions | null {
  if (bytes.length < 24) return null
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (!pngHeader.every((value, index) => bytes[index] === value)) return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  }
}

export function readJpegDimensions(bytes: Uint8Array): MediaDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null

  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (length < 2) return null

    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)

    if (isSof && offset + 8 < bytes.length) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      }
    }

    offset += 2 + length
  }

  return null
}

export function readWebpDimensions(bytes: Uint8Array): MediaDimensions | null {
  if (bytes.length < 30) return null
  const riff = String.fromCharCode(...bytes.slice(0, 4))
  const webp = String.fromCharCode(...bytes.slice(8, 12))
  if (riff !== 'RIFF' || webp !== 'WEBP') return null

  const chunk = String.fromCharCode(...bytes.slice(12, 16))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  if (chunk === 'VP8X' && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    return { width, height }
  }

  if (chunk === 'VP8 ' && bytes.length >= 30) {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    }
  }

  if (chunk === 'VP8L' && bytes.length >= 25) {
    const b0 = bytes[21]
    const b1 = bytes[22]
    const b2 = bytes[23]
    const b3 = bytes[24]
    const width = 1 + (((b1 & 0x3f) << 8) | b0)
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
    return { width, height }
  }

  return null
}

export function detectImageDimensions(body: ArrayBuffer, contentType: string): MediaDimensions | null {
  const bytes = new Uint8Array(body)
  const normalized = contentType.split(';', 1)[0]?.trim().toLowerCase()

  if (normalized === 'image/png') return readPngDimensions(bytes)
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return readJpegDimensions(bytes)
  if (normalized === 'image/webp') return readWebpDimensions(bytes)

  return null
}

export function resolveImagePriceTierFromOutput(output: TaskOutput): '1k' | '2k' | '4k' | '8k' | null {
  const width = output.width ?? 0
  const height = output.height ?? 0
  const longEdge = Math.max(width, height)
  if (longEdge <= 0) return null
  if (longEdge <= 1920) return '1k'
  if (longEdge <= 2560) return '2k'
  if (longEdge <= 3840) return '4k'
  return '8k'
}

/* ─── Output Persistence ──────────────────────────── */

export function normalizeInternalOutput(taskId: string, output: TaskOutput, r2Key: string): TaskOutput {
  return {
    ...output,
    url: toInternalFileUrl(r2Key),
    r2_key: r2Key,
    fileName: output.fileName ?? inferOutputFileName(taskId, output),
  }
}

export async function fetchOutputPayload(output: TaskOutput): Promise<{
  body: ArrayBuffer
  contentType: string
}> {
  if (!isUrlOutput(output)) {
    throw new Error('Task output is not a valid URL payload')
  }

  const response = await fetch(output.url)
  if (!response.ok) {
    throw new Error(`Failed to fetch task output: ${response.status} ${response.statusText}`)
  }

  const body = await response.arrayBuffer()
  const contentType =
    response.headers.get('content-type') ??
    output.contentType ??
    'application/octet-stream'

  return { body, contentType }
}

export async function persistTaskOutput(
  taskId: string,
  userId: string,
  output: TaskOutput,
  runtime: TaskServiceRuntime,
): Promise<TaskOutput> {
  if (!isUrlOutput(output)) {
    return output
  }

  const existingKey =
    output.r2_key ??
    (output.url ? extractR2KeyFromFileUrl(output.url) : null)

  if (existingKey?.startsWith(`outputs/${userId}/`)) {
    return normalizeInternalOutput(taskId, output, existingKey)
  }

  const { body, contentType } = await fetchOutputPayload(output)
  const ext =
    inferExtensionFromContentType(contentType) ??
    inferOutputExtension({ ...output, contentType }) ??
    'bin'
  const r2Key = generateOutputPath(userId, taskId, ext)
  const fileName = output.fileName ?? `${taskId}.${ext}`
  const r2 = await runtime.getR2()

  await r2.put(r2Key, body, {
    httpMetadata: {
      contentType,
      contentDisposition: `inline; filename="${fileName}"`,
    },
  })

  const dimensions =
    contentType.startsWith('image/')
      ? detectImageDimensions(body, contentType)
      : null

  return {
    ...output,
    contentType,
    fileName,
    ...(dimensions ?? {}),
    r2_key: r2Key,
    url: await toPublicFileUrl(r2Key),
  }
}
