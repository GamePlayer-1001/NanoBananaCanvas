/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ConditionalNode 条件分支节点组件
 * [POS]: components/nodes 的条件分支节点，根据条件将数据路由到 true/false 输出
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { GitBranch } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Port Definitions ───────────────────────────────── */

const INPUTS = [
  { id: 'value-in', label: 'Value', type: 'any' as const, required: true },
]
const OUTPUTS = [
  { id: 'true-out', label: 'True', type: 'any' as const },
  { id: 'false-out', label: 'False', type: 'any' as const },
]

/* ─── Operators ─────────────────────────────────────── */

const OPERATORS = [
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'contains', label: 'Contains' },
  { value: 'empty', label: 'Is Empty' },
  { value: 'notEmpty', label: 'Not Empty' },
] as const

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'
const INPUT_CLASS = SELECT_CLASS

/* ─── Component ──────────────────────────────────────── */

export function ConditionalNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  const operator = (data.config.operator as string) ?? '=='
  const compareValue = (data.config.compareValue as string) ?? ''

  const needsCompareValue = !['empty', 'notEmpty'].includes(operator)

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  const onOperatorChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ operator: e.target.value }),
    [updateConfig],
  )

  const onCompareValueChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => updateConfig({ compareValue: e.target.value }),
    [updateConfig],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<GitBranch size={14} />}
      inputs={INPUTS}
      outputs={OUTPUTS}
    >
      <div className="space-y-3">
        {/* ── Operator ────────────────────────────── */}
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">{t('conditionOperator')}</label>
          <select value={operator} onChange={onOperatorChange} className={SELECT_CLASS}>
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>

        {/* ── Compare Value ───────────────────────── */}
        {needsCompareValue && (
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">{t('conditionValue')}</label>
            <input
              type="text"
              value={compareValue}
              onChange={onCompareValueChange}
              placeholder="Compare value..."
              className={INPUT_CLASS}
            />
          </div>
        )}
      </div>
    </BaseNode>
  )
}
