/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/lib/utils/simple-markdown
 * [OUTPUT]: 对外提供 DisplayNode 结果展示节点组件 (Markdown 渲染 + 复制按钮)
 * [POS]: components/nodes 的 MVP 输出节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
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
      title={copied ? 'Copied!' : 'Copy result'}
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  )
}

/* ─── Component ───────────────────────────────────────── */

export function DisplayNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const content = data.config.content as string | undefined

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<MonitorPlay size={14} />}
      inputs={INPUTS}
      headerRight={content ? <CopyButton text={content} /> : undefined}
    >
      {content ? (
        <div className="nodrag nowheel max-h-48 overflow-auto text-sm">
          {renderSimpleMarkdown(content)}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-xs">Waiting for input...</p>
      )}
    </BaseNode>
  )
}
