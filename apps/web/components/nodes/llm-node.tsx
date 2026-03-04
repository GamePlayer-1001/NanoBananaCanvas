/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store
 * [OUTPUT]: 对外提供 LLMNode 大语言模型节点组件
 * [POS]: components/nodes 的 MVP AI 节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { BrainCircuit } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Port Definitions ────────────────────────────────── */

const INPUTS = [
  { id: 'prompt-in', label: 'Prompt', type: 'string' as const, required: true },
]
const OUTPUTS = [
  { id: 'text-out', label: 'Response', type: 'string' as const, required: false },
]

/* ─── Component ───────────────────────────────────────── */

export function LLMNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(props.id, { config: { ...data.config, model: e.target.value } })
    },
    [props.id, data.config, updateNodeData],
  )

  const model = (data.config.model as string) ?? 'openai/gpt-4o-mini'

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<BrainCircuit size={14} />}
      inputs={INPUTS}
      outputs={OUTPUTS}
    >
      <div className="space-y-2">
        {/* 模型选择 */}
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Model</label>
          <select
            value={model}
            onChange={onModelChange}
            className="nodrag border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none"
          >
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            <option value="openai/gpt-4o">GPT-4o</option>
            <option value="anthropic/claude-sonnet-4">Claude Sonnet</option>
            <option value="google/gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
          </select>
        </div>

        {/* 输出预览 */}
        {data.config.output && (
          <div className="bg-muted max-h-24 overflow-auto rounded-md p-2 text-xs">
            {String(data.config.output)}
          </div>
        )}
      </div>
    </BaseNode>
  )
}
