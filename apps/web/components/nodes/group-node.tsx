/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps/NodeResizer，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 GroupNode 分组容器节点组件
 * [POS]: components/nodes 的分组容器，不参与执行引擎，用于视觉组织
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { NodeResizer } from '@xyflow/react'
import { Group } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { cn } from '@/lib/utils'

/* ─── Color Palette ─────────────────────────────────── */

const BG_COLORS = [
  { value: 'rgba(99,102,241,0.08)', label: 'Indigo' },
  { value: 'rgba(34,197,94,0.08)', label: 'Green' },
  { value: 'rgba(59,130,246,0.08)', label: 'Blue' },
  { value: 'rgba(239,68,68,0.08)', label: 'Red' },
  { value: 'rgba(168,85,247,0.08)', label: 'Purple' },
  { value: 'rgba(245,158,11,0.08)', label: 'Amber' },
] as const

/* ─── Component ──────────────────────────────────────── */

export function GroupNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)

  const label = data.label ?? 'Group'
  const bgColor = (data.config.bgColor as string) ?? BG_COLORS[0].value

  const onLabelChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateNodeData(props.id, { label: e.target.value })
    },
    [props.id, updateNodeData],
  )

  const onColorChange = useCallback(
    (color: string) => {
      updateNodeData(props.id, { config: { ...data.config, bgColor: color } })
    },
    [props.id, data.config, updateNodeData],
  )

  return (
    <div
      className={cn(
        'relative h-full w-full rounded-xl border-2 border-dashed',
        'transition-shadow duration-150',
        props.selected ? 'border-[var(--brand-500)] shadow-md' : 'border-border/60',
      )}
      style={{ backgroundColor: bgColor, minWidth: 300, minHeight: 200 }}
    >
      <NodeResizer
        isVisible={!!props.selected}
        minWidth={300}
        minHeight={200}
        lineClassName="!border-[var(--brand-500)]"
        handleClassName="!bg-[var(--brand-500)] !w-2 !h-2 !rounded-sm"
      />

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Group size={14} className="text-muted-foreground" />
        <input
          value={label}
          onChange={onLabelChange}
          className="nodrag nowheel border-none bg-transparent text-sm font-semibold outline-none"
          placeholder="Group name"
        />

        {/* ── Color Dots ───────────────────────────── */}
        <div className="ml-auto flex gap-1">
          {BG_COLORS.map((c) => (
            <button
              key={c.value}
              className={cn(
                'nodrag h-3 w-3 rounded-full border transition-transform',
                bgColor === c.value ? 'scale-125 border-black/30' : 'border-black/10 hover:scale-110',
              )}
              style={{ backgroundColor: c.value.replace('0.08', '0.4') }}
              onClick={() => onColorChange(c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
