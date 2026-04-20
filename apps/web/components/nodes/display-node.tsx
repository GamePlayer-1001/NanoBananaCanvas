/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/lib/utils/simple-markdown，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 DisplayNode 结果展示节点组件 (任意输入渲染: 文本/图片/视频/音频/JSON/裸 base64 + 下载)
 * [POS]: components/nodes 的输出节点，被 registry 注册并在画布中渲染，负责把上游任意结果直接落地为干净预览与下载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 节点预览支持 data URL 与任意运行时输出，需要保留原生媒体标签。 */

import { useCallback, useState, useRef, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import {
  MonitorPlay,
  Copy,
  Check,
  Download,
} from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { renderSimpleMarkdown } from '@/lib/utils/simple-markdown'
import { BaseNode } from './base-node'

/* ─── Copy Button ─────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('nodes')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* 清理定时器 */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 静默处理复制失败 */
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground nodrag rounded p-0.5 transition-colors"
      title={copied ? t('copied') : t('copyResult')}
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  )
}

type DownloadPayload =
  | { kind: 'href'; href: string; filename: string }
  | { kind: 'blob'; blob: Blob; filename: string }

function DownloadButton({ payload }: { payload: DownloadPayload }) {
  const t = useTranslations('nodes')

  const handleDownload = useCallback(async () => {
    let temporaryUrl: string | null = null

    try {
      if (payload.kind === 'href' && !isDataUrl(payload.href)) {
        try {
          const response = await fetch(payload.href)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const blob = await response.blob()
          temporaryUrl = URL.createObjectURL(blob)
        } catch {
          temporaryUrl = payload.href
        }
      } else if (payload.kind === 'blob') {
        temporaryUrl = URL.createObjectURL(payload.blob)
      } else {
        temporaryUrl = payload.href
      }

      const link = document.createElement('a')
      link.href = temporaryUrl
      link.download = payload.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      /* 静默处理下载失败 */
    } finally {
      if (temporaryUrl && (payload.kind === 'blob' || temporaryUrl.startsWith('blob:'))) {
        const revokeUrl = temporaryUrl
        window.setTimeout(() => URL.revokeObjectURL(revokeUrl), 1000)
      }
    }
  }, [payload])

  return (
    <button
      onClick={handleDownload}
      className="text-muted-foreground hover:text-foreground nodrag rounded p-0.5 transition-colors"
      title={t('downloadResult')}
    >
      <Download size={12} />
    </button>
  )
}

/* ─── Component ───────────────────────────────────────── */

export function DisplayNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const t = useTranslations('nodes')
  const content = data.config.content
  const copyText = getCopyText(content)
  const downloadPayload = getDownloadPayload(content)

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<MonitorPlay size={14} />}
      minHeight={180}
      bodyClassName="min-h-0"
      headerRight={
        copyText || downloadPayload ? (
          <div className="flex items-center gap-1">
            {downloadPayload ? <DownloadButton payload={downloadPayload} /> : null}
            {copyText ? <CopyButton text={copyText} /> : null}
          </div>
        ) : undefined
      }
    >
      {content != null && content !== '' ? (
        <div className="nodrag nowheel flex h-full min-h-0 flex-col overflow-auto text-sm">
          <ContentRenderer content={content} />
        </div>
      ) : (
        <p className="text-muted-foreground flex h-full items-center justify-center text-center text-xs">
          {t('waitingForInput')}
        </p>
      )}
    </BaseNode>
  )
}

/* ─── Content Type Detection ──────────────────────────── */

type DisplayContentType = 'text' | 'image' | 'video' | 'audio' | 'json'

interface MediaSource {
  url?: string
  base64?: string
  contentType?: string
  fileName?: string
}

function detectContentType(content: unknown): DisplayContentType {
  if (typeof content !== 'string') {
    return detectObjectContentType(content)
  }

  const resolved = resolveDisplayString(content)
  return resolved.type
}

function detectDataUrlType(content: string): DisplayContentType {
  if (content.startsWith('data:image/')) return 'image'
  if (content.startsWith('data:video/')) return 'video'
  if (content.startsWith('data:audio/')) return 'audio'
  return 'text'
}

function resolveDisplayString(content: string): { type: DisplayContentType; value: string } {
  const trimmed = content.trim()

  if (!trimmed) {
    return { type: 'text', value: content }
  }

  if (isDataUrl(trimmed)) {
    return { type: detectDataUrlType(trimmed), value: trimmed }
  }

  const inferredBase64Url = toMediaDataUrl(trimmed)
  if (inferredBase64Url) {
    return { type: detectDataUrlType(inferredBase64Url), value: inferredBase64Url }
  }

  /* URL 扩展名检测 */
  const lower = trimmed.toLowerCase()
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/.test(lower)) {
    return { type: 'image', value: trimmed }
  }
  if (/\.(mp4|webm|mov|avi)(\?|$)/.test(lower)) {
    return { type: 'video', value: trimmed }
  }
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/.test(lower)) {
    return { type: 'audio', value: trimmed }
  }

  /* JSON 检测 */
  if ((content.startsWith('[') || content.startsWith('{')) && content.length > 2) {
    try {
      JSON.parse(trimmed)
      return { type: 'json', value: content }
    } catch {
      /* not JSON */
    }
  }

  return { type: 'text', value: content }
}

function detectObjectContentType(content: unknown): DisplayContentType {
  const media = resolveMediaSource(content)
  if (media) return media.type
  return 'json'
}

function extractMediaSource(content: unknown): MediaSource | null {
  if (!content || typeof content !== 'object') return null

  if ('url' in content && typeof content.url === 'string') {
    const contentType =
      ('contentType' in content && typeof content.contentType === 'string'
        ? content.contentType
        : 'mimeType' in content && typeof content.mimeType === 'string'
          ? content.mimeType
          : 'type' in content && typeof content.type === 'string' && content.type.includes('/')
            ? content.type
            : undefined)
    const fileName =
      'fileName' in content && typeof content.fileName === 'string'
        ? content.fileName
        : 'filename' in content && typeof content.filename === 'string'
          ? content.filename
          : 'name' in content && typeof content.name === 'string'
            ? content.name
            : undefined
    return { url: content.url, contentType, fileName }
  }

  const base64 =
    ('base64' in content && typeof content.base64 === 'string'
      ? content.base64
      : 'b64_json' in content && typeof content.b64_json === 'string'
        ? content.b64_json
        : 'bytesBase64Encoded' in content && typeof content.bytesBase64Encoded === 'string'
          ? content.bytesBase64Encoded
          : undefined)

  if (base64) {
    const contentType =
      ('contentType' in content && typeof content.contentType === 'string'
        ? content.contentType
        : 'mimeType' in content && typeof content.mimeType === 'string'
          ? content.mimeType
          : undefined)
    const fileName =
      'fileName' in content && typeof content.fileName === 'string'
        ? content.fileName
        : 'filename' in content && typeof content.filename === 'string'
          ? content.filename
          : 'name' in content && typeof content.name === 'string'
            ? content.name
            : undefined
    return { base64, contentType, fileName }
  }

  if ('files' in content && Array.isArray(content.files)) {
    const firstFile = content.files.find(
      (file): file is { url?: string; base64?: string; type?: string; mimeType?: string; name?: string; filename?: string } =>
        !!file &&
        typeof file === 'object' &&
        (
          ('url' in file && typeof file.url === 'string') ||
          ('base64' in file && typeof file.base64 === 'string')
        ),
    )
    if (firstFile) {
      return {
        url: typeof firstFile.url === 'string' ? firstFile.url : undefined,
        base64: typeof firstFile.base64 === 'string' ? firstFile.base64 : undefined,
        contentType:
          typeof firstFile.type === 'string'
            ? firstFile.type
            : typeof firstFile.mimeType === 'string'
              ? firstFile.mimeType
              : undefined,
        fileName:
          typeof firstFile.filename === 'string'
            ? firstFile.filename
            : typeof firstFile.name === 'string'
              ? firstFile.name
              : undefined,
      }
    }
  }

  return null
}

function resolveMediaSource(content: unknown): {
  type: DisplayContentType
  value: string
  fileName?: string
} | null {
  const source = extractMediaSource(content)
  if (!source) return null

  const resolvedValue =
    typeof source.url === 'string'
      ? resolveDisplayString(source.url)
      : source.base64
        ? resolveDisplayString(toMediaDataUrl(source.base64, source.contentType) ?? source.base64)
        : null

  if (!resolvedValue || resolvedValue.type === 'text' || resolvedValue.type === 'json') {
    return null
  }

  return { type: resolvedValue.type, value: resolvedValue.value, fileName: source.fileName }
}

function isPrimitiveContent(
  content: unknown,
): content is string | number | boolean | null | undefined {
  return (
    content == null ||
    typeof content === 'string' ||
    typeof content === 'number' ||
    typeof content === 'boolean'
  )
}

function formatPrimitiveContent(content: string | number | boolean | null | undefined): string {
  if (content == null) return 'null'
  return String(content)
}

function getCopyText(content: unknown): string | undefined {
  if (typeof content === 'string') return content
  if (typeof content === 'number' || typeof content === 'boolean') return String(content)
  if (content == null) return undefined
  return JSON.stringify(content, null, 2)
}

function getDownloadPayload(content: unknown): DownloadPayload | undefined {
  if (isPrimitiveContent(content)) {
    if (typeof content === 'string') {
      const resolved = resolveDisplayString(content)
      if (resolved.type === 'image' || resolved.type === 'video' || resolved.type === 'audio') {
        return {
          kind: 'href',
          href: resolved.value,
          filename: `result.${getDefaultExtension(resolved.type, resolved.value)}`,
        }
      }

      if (resolved.type === 'json') {
        return {
          kind: 'blob',
          blob: new Blob([content], { type: 'application/json;charset=utf-8' }),
          filename: 'result.json',
        }
      }
    }

    return {
      kind: 'blob',
      blob: new Blob([formatPrimitiveContent(content)], { type: 'text/plain;charset=utf-8' }),
      filename: 'result.txt',
    }
  }

  const media = resolveMediaSource(content)
  if (media) {
    return {
      kind: 'href',
      href: media.value,
      filename: media.fileName ?? `result.${getDefaultExtension(media.type, media.value)}`,
    }
  }

  return {
    kind: 'blob',
    blob: new Blob([JSON.stringify(content, null, 2)], { type: 'application/json;charset=utf-8' }),
    filename: 'result.json',
  }
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-auto rounded-md bg-slate-950/95 px-3 py-2 text-xs leading-5 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

/* ─── Multi-Modal Renderer ────────────────────────────── */

function ContentRenderer({ content }: { content: unknown }) {
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return <p className="text-muted-foreground text-xs italic">[]</p>
    }

    return (
      <div className="space-y-3">
        {content.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
              Item {index + 1}
            </div>
            <ContentRenderer content={item} />
          </div>
        ))}
      </div>
    )
  }

  if (isPrimitiveContent(content)) {
    const primitive = formatPrimitiveContent(content)
    const resolved = resolveDisplayString(primitive)
    const type = resolved.type

    if (type === 'text') {
      return (
        <div className="prose prose-sm max-w-none break-words text-sm">
          {renderSimpleMarkdown(primitive)}
        </div>
      )
    }

    return (
      <MediaRenderer
        content={resolved.value}
        type={type}
        fallback={primitive}
      />
    )
  }

  if (content && typeof content === 'object') {
    const media = resolveMediaSource(content)
    if (media) {
      return (
        <MediaRenderer
          content={media.value}
          type={media.type}
          fallback={content}
        />
      )
    }

    return (
      <div className="space-y-3">
        {Object.entries(content).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
              {key}
            </div>
            <ContentRenderer content={value} />
          </div>
        ))}
      </div>
    )
  }

  const type = detectContentType(content)
  const stringContent =
    typeof content === 'string' ? resolveDisplayString(content).value : undefined

  return <MediaRenderer content={stringContent} type={type} fallback={content} />
}

function MediaRenderer({
  content,
  type,
  fallback,
}: {
  content?: string
  type: DisplayContentType
  fallback: unknown
}) {
  switch (type) {
    case 'image':
      return content ? (
        <img
          src={content}
          alt="Generated"
          className="h-full max-h-full w-full object-contain"
        />
      ) : (
        <JsonBlock value={fallback} />
      )
    case 'video':
      return content ? (
        <video src={content} controls className="h-full max-h-full w-full bg-black object-contain" />
      ) : (
        <JsonBlock value={fallback} />
      )
    case 'audio':
      return content ? <audio src={content} controls className="w-full" /> : <JsonBlock value={fallback} />
    case 'json':
      return <JsonBlock value={fallback} />
    default:
      return typeof content === 'string' ? (
        <div className="prose prose-sm max-w-none break-words text-sm">
          {renderSimpleMarkdown(content)}
        </div>
      ) : (
        <JsonBlock value={fallback} />
      )
  }
}

function isDataUrl(value: string): boolean {
  return value.startsWith('data:')
}

function normalizeBase64(base64: string): string {
  return base64.replace(/\s+/g, '')
}

function isLikelyBase64(value: string): boolean {
  const normalized = normalizeBase64(value)
  if (normalized.length < 32 || normalized.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized)
}

function inferMimeTypeFromBase64(base64: string): string | undefined {
  const normalized = normalizeBase64(base64)
  if (!isLikelyBase64(normalized)) return undefined

  if (normalized.startsWith('iVBORw0KGgo')) return 'image/png'
  if (normalized.startsWith('/9j/')) return 'image/jpeg'
  if (normalized.startsWith('R0lGOD')) return 'image/gif'
  if (normalized.startsWith('UklGR')) return normalized.includes('V0VCUA') ? 'image/webp' : 'audio/wav'
  if (normalized.startsWith('Qk')) return 'image/bmp'
  if (normalized.startsWith('PHN2Zy') || normalized.startsWith('PD94bWw')) return 'image/svg+xml'
  if (normalized.startsWith('SUQz') || normalized.startsWith('//uQ') || normalized.startsWith('//sQ')) return 'audio/mpeg'
  if (normalized.startsWith('T2dnUw')) return 'audio/ogg'
  if (normalized.startsWith('AAAAIGZ0eX') || normalized.startsWith('AAAAGGZ0eX') || normalized.startsWith('AAAAMGZ0eX')) return 'video/mp4'
  return undefined
}

function toMediaDataUrl(base64: string, mimeType?: string): string | null {
  const normalized = normalizeBase64(base64)
  if (!isLikelyBase64(normalized)) return null

  const resolvedMimeType = mimeType ?? inferMimeTypeFromBase64(normalized)
  if (!resolvedMimeType) return null

  return `data:${resolvedMimeType};base64,${normalized}`
}

function getDefaultExtension(type: DisplayContentType, value?: string): string {
  if (value?.startsWith('data:image/svg+xml')) return 'svg'
  if (value?.startsWith('data:image/png')) return 'png'
  if (value?.startsWith('data:image/jpeg')) return 'jpg'
  if (value?.startsWith('data:image/gif')) return 'gif'
  if (value?.startsWith('data:image/webp')) return 'webp'
  if (value?.startsWith('data:audio/mpeg')) return 'mp3'
  if (value?.startsWith('data:audio/wav')) return 'wav'
  if (value?.startsWith('data:audio/ogg')) return 'ogg'
  if (value?.startsWith('data:video/mp4')) return 'mp4'

  switch (type) {
    case 'image':
      return 'png'
    case 'audio':
      return 'mp3'
    case 'video':
      return 'mp4'
    case 'json':
      return 'json'
    default:
      return 'txt'
  }
}
