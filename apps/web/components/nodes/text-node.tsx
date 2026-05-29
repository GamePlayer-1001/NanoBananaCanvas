/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations，依赖 @/lib/billing/workflow-execution-guard 的文本上限常量
 * [OUTPUT]: 对外提供 TextNode 纯文本输入节点组件
 * [POS]: components/nodes 的纯文本输入节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Type } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { TEXT_INPUT_MAX_LENGTH } from '@/lib/billing/workflow-execution-guard'
import { BaseNode } from './base-node'

/* ─── Component ───────────────────────────────────────── */

export function TextNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(props.id, {
        config: { ...data.config, text: e.target.value.slice(0, TEXT_INPUT_MAX_LENGTH) },
      })
    },
    [props.id, data.config, updateNodeData],
  )

  const textValue = (data.config.text as string) ?? ''
  const remaining = TEXT_INPUT_MAX_LENGTH - textValue.length

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<Type size={14} />}
      minHeight={160}
      bodyClassName="min-h-0 gap-2 pb-4"
    >
      <textarea
        value={textValue}
        onChange={onChange}
        placeholder={t('typeSomething')}
        rows={4}
        maxLength={TEXT_INPUT_MAX_LENGTH}
        className="nodrag nowheel border-input bg-background h-full min-h-[112px] w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none"
      />
      <div className="text-muted-foreground text-right text-[11px] leading-none">
        {t('textLengthCounter', { current: textValue.length, max: TEXT_INPUT_MAX_LENGTH })}
        {remaining <= 20 ? ` · ${t('textLengthRemaining', { count: remaining })}` : ''}
      </div>
    </BaseNode>
  )
}
