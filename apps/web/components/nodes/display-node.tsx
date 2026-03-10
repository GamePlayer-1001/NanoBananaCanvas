/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/lib/utils/simple-markdown，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 DisplayNode 结果展示节点组件 (多模态渲染: 文本/图片/视频/音频)
 * [POS]: components/nodes 的 MVP 输出节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { MonitorPlay, Copy, Check } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { renderSimpleMarkdown } from '@/lib/utils/simple-markdown'
import { BaseNode } from './base-node'

/* ─── Port Definitions ────────────────────────────────── */

const INPUTS = [
  { id: 'content-in', label: 'Content', type: 'any' as const, required: true },
]

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
  const content = data.config.content as string | undefined

  const contentType = detectContentType(content)
  const copyText = contentType === 'text' ? content : undefined

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<MonitorPlay size={14} />}
      inputs={INPUTS}
      headerRight={copyText ? <CopyButton text={copyText} /> : undefined}
    >
      {content ? (
        <div className="nodrag nowheel max-h-48 overflow-auto text-sm">
          <ContentRenderer content={content} type={contentType} />
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-xs">{t('waitingForInput')}</p>
      )}
    </BaseNode>
  )
}

/* ─── Content Type Detection ──────────────────────────── */

type DisplayContentType = 'text' | 'image' | 'video' | 'audio' | 'json'

function detectContentType(content: string | undefined): DisplayContentType {
  if (!content) return 'text'

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
    try { JSON.parse(content); return 'json' } catch { /* not JSON */ }
  }

  return 'text'
}

/* ─── Multi-Modal Renderer ────────────────────────────── */

function ContentRenderer({ content, type }: { content: string; type: DisplayContentType }) {
  switch (type) {
    case 'image':
      return <img src={content} alt="Generated" className="max-h-40 w-full rounded object-contain" />
    case 'video':
      return <video src={content} controls className="max-h-40 w-full rounded" />
    case 'audio':
      return <audio src={content} controls className="w-full" />
    case 'json':
      return <pre className="text-muted-foreground overflow-auto text-xs">{JSON.stringify(JSON.parse(content), null, 2)}</pre>
    default:
      return <>{renderSimpleMarkdown(content)}</>
  }
}
