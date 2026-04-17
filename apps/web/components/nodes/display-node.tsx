/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/lib/utils/simple-markdown，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 DisplayNode 结果展示节点组件 (任意输入渲染: 文本/图片/视频/音频/JSON)
 * [POS]: components/nodes 的输出节点，被 registry 注册并在画布中渲染，负责把上游任意结果安全落地为可视预览
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 节点预览支持 data URL 与任意运行时输出，需要保留原生媒体标签。 */

import { useCallback, useState, useRef, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { MonitorPlay, Copy, Check } from 'lucide-react'
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

/* ─── Component ───────────────────────────────────────── */

export function DisplayNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const t = useTranslations('nodes')
  const content = data.config.content
  const copyText = getCopyText(content)

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<MonitorPlay size={14} />}
      headerRight={copyText ? <CopyButton text={copyText} /> : undefined}
    >
      {content != null && content !== '' ? (
        <div className="nodrag nowheel max-h-48 overflow-auto text-sm">
          <ContentRenderer content={content} />
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-xs">
          {t('waitingForInput')}
        </p>
      )}
    </BaseNode>
  )
}

/* ─── Content Type Detection ──────────────────────────── */

type DisplayContentType = 'text' | 'image' | 'video' | 'audio' | 'json'

function detectContentType(content: unknown): DisplayContentType {
  if (typeof content !== 'string') {
    return detectObjectContentType(content)
  }

  /* data URI 检测 */
  if (content.startsWith('data:image/')) return 'image'
  if (content.startsWith('data:video/')) return 'video'
  if (content.startsWith('data:audio/')) return 'audio'

  /* URL 扩展名检测 */
  const lower = content.trim().toLowerCase()
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/.test(lower)) return 'image'
  if (/\.(mp4|webm|mov|avi)(\?|$)/.test(lower)) return 'video'
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/.test(lower)) return 'audio'

  /* JSON 检测 */
  if ((content.startsWith('[') || content.startsWith('{')) && content.length > 2) {
    try {
      JSON.parse(content)
      return 'json'
    } catch {
      /* not JSON */
    }
  }

  return 'text'
}

function detectObjectContentType(content: unknown): DisplayContentType {
  const media = extractMediaUrl(content)
  if (media) return detectContentType(media.url)
  return 'json'
}

function extractMediaUrl(content: unknown): { url: string; contentType?: string } | null {
  if (!content || typeof content !== 'object') return null

  if ('url' in content && typeof content.url === 'string') {
    const contentType =
      'contentType' in content && typeof content.contentType === 'string'
        ? content.contentType
        : undefined
    return { url: content.url, contentType }
  }

  if ('files' in content && Array.isArray(content.files)) {
    const firstFile = content.files.find(
      (file): file is { url: string; type?: string } =>
        !!file &&
        typeof file === 'object' &&
        'url' in file &&
        typeof file.url === 'string',
    )
    if (firstFile) {
      return { url: firstFile.url, contentType: firstFile.type }
    }
  }

  return null
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

/* ─── Multi-Modal Renderer ────────────────────────────── */

function ContentRenderer({ content }: { content: unknown }) {
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return <p className="text-muted-foreground text-xs italic">[]</p>
    }

    return (
      <div className="space-y-2">
        {content.map((item, index) => (
          <div key={index} className="bg-muted/40 rounded-md border p-2">
            <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase">
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
    const type = detectContentType(primitive)

    if (type === 'text') {
      return <>{renderSimpleMarkdown(primitive)}</>
    }

    return <MediaRenderer content={primitive} type={type} fallback={primitive} />
  }

  if (content && typeof content === 'object') {
    const media = extractMediaUrl(content)
    if (media) {
      const type = detectContentType(media.contentType ? `data:${media.contentType}` : media.url)
      return <MediaRenderer content={media.url} type={type} fallback={content} />
    }

    return (
      <div className="space-y-2">
        {Object.entries(content).map(([key, value]) => (
          <div key={key} className="bg-muted/30 rounded-md border p-2">
            <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase">
              {key}
            </div>
            <ContentRenderer content={value} />
          </div>
        ))}
      </div>
    )
  }

  const type = detectContentType(content)
  const media = extractMediaUrl(content)
  const stringContent = typeof content === 'string' ? content : media?.url

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
          className="max-h-40 w-full rounded object-contain"
        />
      ) : (
        <pre className="text-muted-foreground overflow-auto text-xs">
          {JSON.stringify(fallback, null, 2)}
        </pre>
      )
    case 'video':
      return content ? (
        <video src={content} controls className="max-h-40 w-full rounded" />
      ) : (
        <pre className="text-muted-foreground overflow-auto text-xs">
          {JSON.stringify(fallback, null, 2)}
        </pre>
      )
    case 'audio':
      return content ? (
        <audio src={content} controls className="w-full" />
      ) : (
        <pre className="text-muted-foreground overflow-auto text-xs">
          {JSON.stringify(fallback, null, 2)}
        </pre>
      )
    case 'json':
      return (
        <pre className="text-muted-foreground overflow-auto text-xs">
          {JSON.stringify(fallback, null, 2)}
        </pre>
      )
    default:
      return typeof content === 'string' ? (
        <>
          {renderSimpleMarkdown(content)}
        </>
      ) : (
        <pre className="text-muted-foreground overflow-auto text-xs">
          {JSON.stringify(fallback, null, 2)}
        </pre>
      )
  }
}
