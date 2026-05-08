/**
 * [INPUT]: 依赖 next/dynamic 的客户端动态拆分，依赖 ./model-mind-map-section
 * [OUTPUT]: 对外提供 DeferredModelMindMap 客户端延后加载组件
 * [POS]: landing 模块的轻量包装器，被服务端 landing page 消费，用于把重型模型云图延后到客户端再加载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import dynamic from 'next/dynamic'

const ModelMindMapSection = dynamic(
  () =>
    import('./model-mind-map-section').then((module) => ({
      default: module.ModelMindMapSection,
    })),
  {
    ssr: false,
    loading: () => <div className="min-h-[44rem] bg-[#05070d]" aria-hidden="true" />,
  },
)

export function DeferredModelMindMap() {
  return <ModelMindMapSection />
}
