/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 LoopNode 循环节点组件
 * [POS]: components/nodes 的循环节点，对输入数据逐项执行 body 子图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Repeat } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Port Definitions ───────────────────────────────── */

const INPUTS = [
  { id: 'items-in', label: 'Items', type: 'any' as const, required: true },
]
const OUTPUTS = [
  { id: 'item-out', label: 'Item', type: 'any' as const },
  { id: 'index-out', label: 'Index', type: 'number' as const },
  { id: 'results-out', label: 'Results', type: 'any' as const },
]

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'
const INPUT_CLASS = SELECT_CLASS

/* ─── Component ──────────────────────────────────────── */

export function LoopNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  const mode = (data.config.mode as string) ?? 'forEach'
  const iterations = (data.config.iterations as number) ?? 3
  const separator = (data.config.separator as string) ?? '\\n'

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  const onModeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ mode: e.target.value }),
    [updateConfig],
  )

  const onIterationsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => updateConfig({ iterations: parseInt(e.target.value) || 1 }),
    [updateConfig],
  )

  const onSeparatorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => updateConfig({ separator: e.target.value }),
    [updateConfig],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<Repeat size={14} />}
      inputs={INPUTS}
      outputs={OUTPUTS}
    >
      <div className="space-y-3">
        {/* ── Mode ────────────────────────────────── */}
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">{t('loopMode')}</label>
          <select value={mode} onChange={onModeChange} className={SELECT_CLASS}>
            <option value="forEach">For Each</option>
            <option value="repeat">Repeat N</option>
          </select>
        </div>

        {/* ── Iterations (repeat mode) ────────────── */}
        {mode === 'repeat' && (
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">{t('loopIterations')}</label>
            <input
              type="number"
              min={1}
              max={100}
              value={iterations}
              onChange={onIterationsChange}
              className={INPUT_CLASS}
            />
          </div>
        )}

        {/* ── Separator (forEach mode) ────────────── */}
        {mode === 'forEach' && (
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">{t('loopSeparator')}</label>
            <input
              type="text"
              value={separator}
              onChange={onSeparatorChange}
              placeholder="\\n"
              className={INPUT_CLASS}
            />
          </div>
        )}
      </div>
    </BaseNode>
  )
}
