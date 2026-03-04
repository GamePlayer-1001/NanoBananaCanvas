/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store
 * [OUTPUT]: 对外提供 TextInputNode 文本输入节点组件
 * [POS]: components/nodes 的 MVP 输入节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Type } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Port Definitions ────────────────────────────────── */

const OUTPUTS = [
  { id: 'text-out', label: 'Text', type: 'string' as const, required: false },
]

/* ─── Component ───────────────────────────────────────── */

export function TextInputNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(props.id, { config: { ...data.config, text: e.target.value } })
    },
    [props.id, data.config, updateNodeData],
  )

  return (
    <BaseNode {...props} data={data} icon={<Type size={14} />} outputs={OUTPUTS}>
      <textarea
        value={(data.config.text as string) ?? ''}
        onChange={onChange}
        placeholder="Enter text..."
        rows={3}
        className="nodrag nowheel border-input bg-background w-full resize-none rounded-md border px-2 py-1.5 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none"
      />
    </BaseNode>
  )
}
