/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 TextMergeNode 文本合并节点与 ImageMergeNode 图片合并节点
 * [POS]: components/nodes 的工具型汇聚节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Combine, Images } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

const INPUT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

export function TextMergeNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const separator = (data.config.separator as string) ?? '\\n'

  const onSeparatorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateNodeData(props.id, { config: { ...data.config, separator: e.target.value } })
    },
    [props.id, data.config, updateNodeData],
  )

  return (
    <BaseNode {...props} data={data} icon={<Combine size={14} />}>
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">{t('textMergeHint')}</p>
        <label className="text-muted-foreground block text-xs">
          {t('mergeSeparator')}
        </label>
        <input
          type="text"
          value={separator}
          onChange={onSeparatorChange}
          placeholder="\\n"
          className={INPUT_CLASS}
        />
      </div>
    </BaseNode>
  )
}

export function ImageMergeNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const t = useTranslations('nodes')

  return (
    <BaseNode {...props} data={data} icon={<Images size={14} />}>
      <p className="text-muted-foreground text-xs">{t('imageMergeHint')}</p>
    </BaseNode>
  )
}
