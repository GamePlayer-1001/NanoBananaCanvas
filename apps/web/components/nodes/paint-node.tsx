/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 ./paint-dialog 的 PaintDialog/PaintAspectRatio，
 *          依赖 @/stores/use-flow-store，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 PaintNode 绘图节点组件 (节点缩略图 + 双击触发 PaintDialog)
 * [POS]: components/nodes 的绘图输入源节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 节点内缩略图为 R2 签名 URL，使用原生 img 即可。 */

import { useCallback, useEffect, useState } from 'react'
import { useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Brush } from 'lucide-react'

import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'
import {
  PAINT_ASPECT_RATIOS,
  PaintDialog,
  type PaintAspectRatio,
} from './paint-dialog'

const DEFAULT_ASPECT: PaintAspectRatio = '1:1'
const DEFAULT_BRUSH_SIZE = 6
const DEFAULT_BRUSH_COLOR = '#111827'

function isPaintAspectRatio(value: unknown): value is PaintAspectRatio {
  return PAINT_ASPECT_RATIOS.some((r) => r.id === value)
}

export function PaintNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const updateNodeInternals = useUpdateNodeInternals()
  const t = useTranslations('nodes')

  const imageUrl = (data.config.imageUrl as string | undefined) ?? undefined
  const rawAspect = data.config.aspectRatio
  const aspectRatio: PaintAspectRatio = isPaintAspectRatio(rawAspect)
    ? rawAspect
    : DEFAULT_ASPECT
  const brushSize =
    typeof data.config.brushSize === 'number' ? data.config.brushSize : DEFAULT_BRUSH_SIZE
  const brushColor =
    typeof data.config.brushColor === 'string' && data.config.brushColor.length > 0
      ? data.config.brushColor
      : DEFAULT_BRUSH_COLOR

  const [open, setOpen] = useState(false)
  const hasImage = Boolean(imageUrl)

  useEffect(() => {
    const rafId = requestAnimationFrame(() => updateNodeInternals(props.id))
    return () => cancelAnimationFrame(rafId)
  }, [imageUrl, props.id, updateNodeInternals])

  const onSave = useCallback(
    (params: {
      imageUrl: string
      aspectRatio: PaintAspectRatio
      brushSize: number
      brushColor: string
    }) => {
      updateNodeData(props.id, {
        config: {
          ...data.config,
          imageUrl: params.imageUrl,
          aspectRatio: params.aspectRatio,
          brushSize: params.brushSize,
          brushColor: params.brushColor,
        },
      })
    },
    [data.config, props.id, updateNodeData],
  )

  return (
    <>
      <BaseNode
        {...props}
        data={data}
        icon={<Brush size={14} />}
        minHeight={140}
        bodyClassName="min-h-0"
      >
        <div
          className="flex h-full min-h-0 flex-col"
          onDoubleClick={(event) => {
            event.stopPropagation()
            setOpen(true)
          }}
        >
          {!hasImage ? (
            <div className="text-muted-foreground mb-1.5 text-[11px] leading-snug">
              {t('paintHint')}
            </div>
          ) : null}
          <div
            className={
              'bg-muted/40 group/paint min-h-0 flex-1 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors hover:border-[var(--brand-500)]/60'
            }
          >
            {hasImage ? (
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-[11px]">
                <Brush size={20} className="opacity-60" />
                <span>{t('paintDoubleClickToOpen')}</span>
              </div>
            )}
          </div>
        </div>
      </BaseNode>

      <PaintDialog
        open={open}
        onOpenChange={setOpen}
        initialAspect={aspectRatio}
        initialBrushSize={brushSize}
        initialBrushColor={brushColor}
        onSave={onSave}
      />
    </>
  )
}
