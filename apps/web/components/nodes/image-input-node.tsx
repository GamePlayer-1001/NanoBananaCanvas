/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/components/shared/image-upload，
 *          依赖 @/stores/use-flow-store，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageInputNode 图片输入节点组件
 * [POS]: components/nodes 的图片输入源节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { ImagePlus } from 'lucide-react'

import { ImageUpload } from '@/components/shared/image-upload'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

export function ImageInputNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const imageUrl = (data.config.imageUrl as string | undefined) ?? undefined

  const onChange = useCallback(
    (url: string | undefined) => {
      updateNodeData(props.id, {
        config: { ...data.config, imageUrl: url ?? '' },
      })
    },
    [props.id, data.config, updateNodeData],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<ImagePlus size={14} />}
      minHeight={220}
      bodyClassName="min-h-0"
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="text-muted-foreground text-xs">{t('imageInputHint')}</div>
        <ImageUpload value={imageUrl} onChange={onChange} className="h-full min-h-[128px] w-full" />
      </div>
    </BaseNode>
  )
}
