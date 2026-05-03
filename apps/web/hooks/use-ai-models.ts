/**
 * [INPUT]: 依赖 react 的 useMemo，依赖 @/lib/platform-runtime 的静态平台目录，依赖 @/lib/platform-models 的统一目录类型
 * [OUTPUT]: 对外提供 useAIModels
 * [POS]: hooks 的 AI 模型目录数据层，被 canvas 平台模型选择器消费，直接复用静态平台目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo } from 'react'

import type { PlatformModelCatalogItem } from '@/lib/platform-models'
import {
  listPlatformRuntimeModels,
  type PlatformModelCategory,
} from '@/lib/platform-runtime'

/* ─── Hook ───────────────────────────────────────────── */

export function useAIModels(category?: string) {
  const data = useMemo<PlatformModelCatalogItem[]>(
    () =>
      listPlatformRuntimeModels(category as PlatformModelCategory | undefined).map(
        (item, index) => ({
          id: `runtime-${item.category}-${index + 1}`,
          provider: item.supplierId,
          modelId: item.modelId,
          modelName: item.modelName,
          category: item.category,
          tier: item.tier,
          accessible: true,
        }),
      ),
    [category],
  )

  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
  }
}
