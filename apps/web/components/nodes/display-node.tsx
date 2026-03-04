/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node
 * [OUTPUT]: 对外提供 DisplayNode 结果展示节点组件
 * [POS]: components/nodes 的 MVP 输出节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { NodeProps } from '@xyflow/react'
import { MonitorPlay } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { BaseNode } from './base-node'

/* ─── Port Definitions ────────────────────────────────── */

const INPUTS = [
  { id: 'content-in', label: 'Content', type: 'any' as const, required: true },
]

/* ─── Component ───────────────────────────────────────── */

export function DisplayNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const content = data.config.content as string | undefined

  return (
    <BaseNode {...props} data={data} icon={<MonitorPlay size={14} />} inputs={INPUTS}>
      {content ? (
        <div className="max-h-32 overflow-auto text-sm whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-xs">Waiting for input...</p>
      )}
    </BaseNode>
  )
}
