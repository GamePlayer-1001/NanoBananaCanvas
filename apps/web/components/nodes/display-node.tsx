/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/lib/utils/simple-markdown，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 DisplayNode 结果展示节点组件 (任意输入渲染: 文本/图片/视频/音频/JSON)
 * [POS]: components/nodes 的输出节点，被 registry 注册并在画布中渲染，负责把上游任意结果安全落地为可视预览
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 节点预览支持 data URL 与任意运行时输出，需要保留原生媒体标签。 */

import { useCallback, useState, useRef, useEffect, type ReactNode } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { MonitorPlay, Copy, Check, Braces, FileText, Image as ImageIcon, Film, AudioLines, ListTree } from 'lucide-react'
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
        <div className="nodrag nowheel max-h-64 overflow-auto text-sm">
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

type InspectorTone = 'text' | 'image' | 'video' | 'audio' | 'json' | 'list'

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

function getInspectorMeta(type: InspectorTone) {
  switch (type) {
    case 'image':
      return {
        label: 'Image',
        icon: ImageIcon,
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        panelClass: 'border-emerald-200/80 bg-emerald-50/40',
      }
    case 'video':
      return {
        label: 'Video',
        icon: Film,
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
        panelClass: 'border-sky-200/80 bg-sky-50/40',
      }
    case 'audio':
      return {
        label: 'Audio',
        icon: AudioLines,
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        panelClass: 'border-amber-200/80 bg-amber-50/40',
      }
    case 'json':
      return {
        label: 'JSON',
        icon: Braces,
        badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
        panelClass: 'border-violet-200/80 bg-violet-50/40',
      }
    case 'list':
      return {
        label: 'List',
        icon: ListTree,
        badgeClass: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
        panelClass: 'border-fuchsia-200/80 bg-fuchsia-50/40',
      }
    default:
      return {
        label: 'Text',
        icon: FileText,
        badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
        panelClass: 'border-slate-200/80 bg-slate-50/70',
      }
  }
}

function InspectorPanel({
  tone,
  title,
  subtitle,
  children,
}: {
  tone: InspectorTone
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const meta = getInspectorMeta(tone)
  const Icon = meta.icon

  return (
    <section className={`rounded-xl border p-2.5 shadow-sm ${meta.panelClass}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-foreground text-xs font-semibold">{title}</div>
          {subtitle ? (
            <div className="text-muted-foreground mt-0.5 text-[11px]">{subtitle}</div>
          ) : null}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${meta.badgeClass}`}
        >
          <Icon size={11} />
          {meta.label}
        </span>
      </div>
      <div className="rounded-lg border border-white/60 bg-white/85 p-2.5 backdrop-blur-sm">
        {children}
      </div>
    </section>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="text-muted-foreground overflow-auto rounded-md bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

/* ─── Multi-Modal Renderer ────────────────────────────── */

function ContentRenderer({ content }: { content: unknown }) {
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return (
        <InspectorPanel tone="list" title="Empty list" subtitle="上游返回了一个空数组">
          <p className="text-muted-foreground text-xs italic">[]</p>
        </InspectorPanel>
      )
    }

    return (
      <InspectorPanel
        tone="list"
        title="Collection output"
        subtitle={`共 ${content.length} 项，已按顺序展开`}
      >
        <div className="space-y-2">
        {content.map((item, index) => (
            <div key={index} className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-2">
              <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-[0.18em] uppercase">
                Item {index + 1}
              </div>
              <ContentRenderer content={item} />
            </div>
        ))}
        </div>
      </InspectorPanel>
    )
  }

  if (isPrimitiveContent(content)) {
    const primitive = formatPrimitiveContent(content)
    const type = detectContentType(primitive)

    if (type === 'text') {
      return (
        <InspectorPanel
          tone="text"
          title="Text output"
          subtitle={`${primitive.length} chars`}
        >
          <div className="prose prose-sm max-w-none break-words text-sm">
            {renderSimpleMarkdown(primitive)}
          </div>
        </InspectorPanel>
      )
    }

    return (
      <MediaRenderer
        content={primitive}
        type={type}
        fallback={primitive}
        title="Media output"
      />
    )
  }

  if (content && typeof content === 'object') {
    const media = extractMediaUrl(content)
    if (media) {
      const type = detectContentType(media.contentType ? `data:${media.contentType}` : media.url)
      return (
        <MediaRenderer
          content={media.url}
          type={type}
          fallback={content}
          title="Structured media"
        />
      )
    }

    return (
      <InspectorPanel
        tone="json"
        title="Structured output"
        subtitle={`${Object.keys(content).length} fields`}
      >
        <div className="space-y-2">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-2">
              <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-[0.18em] uppercase">
                {key}
              </div>
              <ContentRenderer content={value} />
            </div>
          ))}
        </div>
      </InspectorPanel>
    )
  }

  const type = detectContentType(content)
  const media = extractMediaUrl(content)
  const stringContent = typeof content === 'string' ? content : media?.url

  return <MediaRenderer content={stringContent} type={type} fallback={content} title="Result output" />
}

function MediaRenderer({
  content,
  type,
  fallback,
  title,
}: {
  content?: string
  type: DisplayContentType
  fallback: unknown
  title: string
}) {
  switch (type) {
    case 'image':
      return (
        <InspectorPanel tone="image" title={title} subtitle="图片结果预览">
          {content ? (
            <img
              src={content}
              alt="Generated"
              className="max-h-48 w-full rounded-lg bg-slate-100 object-contain"
            />
          ) : (
            <JsonBlock value={fallback} />
          )}
        </InspectorPanel>
      )
    case 'video':
      return (
        <InspectorPanel tone="video" title={title} subtitle="视频结果预览">
          {content ? (
            <video src={content} controls className="max-h-48 w-full rounded-lg bg-slate-950" />
          ) : (
            <JsonBlock value={fallback} />
          )}
        </InspectorPanel>
      )
    case 'audio':
      return (
        <InspectorPanel tone="audio" title={title} subtitle="音频结果预览">
          {content ? (
            <div className="rounded-lg bg-amber-50 p-2">
              <audio src={content} controls className="w-full" />
            </div>
          ) : (
            <JsonBlock value={fallback} />
          )}
        </InspectorPanel>
      )
    case 'json':
      return (
        <InspectorPanel tone="json" title={title} subtitle="结构化结果">
          <JsonBlock value={fallback} />
        </InspectorPanel>
      )
    default:
      return typeof content === 'string' ? (
        <InspectorPanel tone="text" title={title} subtitle={`${content.length} chars`}>
          <div className="prose prose-sm max-w-none break-words text-sm">
            {renderSimpleMarkdown(content)}
          </div>
        </InspectorPanel>
      ) : (
        <InspectorPanel tone="json" title={title} subtitle="无法识别的结果已回退为 JSON">
          <JsonBlock value={fallback} />
        </InspectorPanel>
      )
  }
}
