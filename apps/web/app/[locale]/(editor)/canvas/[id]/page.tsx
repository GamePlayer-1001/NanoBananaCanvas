/**
 * [INPUT]: 依赖 next/dynamic 的客户端动态导入，依赖 @/components/canvas/canvas，
 *          依赖 @/components/agent/* 的 M1 面板骨架，
 *          依赖 @/hooks/use-workflows 的 useWorkflow 数据获取，
 *          依赖 @/stores/use-flow-store 的 setFlow 注入画布数据，
 *          依赖 @/stores/use-agent-store 的会话占位状态，
 *          依赖 @/services/storage/serializer 的反序列化，
 *          依赖 lucide-react 的 Loader2
 * [OUTPUT]: 对外提供全屏画布编辑器页面 (CSR)
 * [POS]: (editor)/canvas/[id] 路由，全屏无侧边栏，从 D1 加载工作流数据注入 FlowStore，并在右侧挂载 Agent 面板骨架
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { use, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactFlowProvider } from '@xyflow/react'
import { AgentComposer } from '@/components/agent/agent-composer'
import { AgentConversation } from '@/components/agent/agent-conversation'
import { AgentHeader } from '@/components/agent/agent-header'
import { AgentPanel } from '@/components/agent/agent-panel'
import { AgentQuickActions } from '@/components/agent/agent-quick-actions'
import { useWorkflow } from '@/hooks/use-workflows'
import type { AgentMessage } from '@/stores/use-agent-store'
import { useAgentStore } from '@/stores/use-agent-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { deserializeWorkflow } from '@/services/storage/serializer'

const Canvas = dynamic(
  () => import('@/components/canvas/canvas').then((m) => ({ default: m.Canvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    ),
  },
)

/* ─── Page ────────────────────────────────────────────── */

export default function CanvasPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations('canvas')
  const { data, isLoading } = useWorkflow(id)
  const hasLoaded = useRef(false)
  const canEdit = (data as Record<string, unknown> | undefined)?.canEdit === true
  const messages = useAgentStore((state) => state.messages)
  const mode = useAgentStore((state) => state.mode)
  const status = useAgentStore((state) => state.status)
  const appendMessage = useAgentStore((state) => state.appendMessage)

  const conversationItems = useMemo(
    () =>
      messages.map((message) => {
        if (message.role === 'process') {
          return {
            id: message.id,
            type: 'process' as const,
            text: message.text,
            active: status !== 'idle' && status !== 'error',
          }
        }

        if (message.role === 'proposal') {
          return {
            id: message.id,
            type: 'proposal' as const,
            title: '工作流提案',
            summary: `提案 ID：${message.planId}`,
            requiresConfirmation: false,
          }
        }

        if (message.role === 'prompt-confirmation') {
          return {
            id: message.id,
            type: 'prompt-confirmation' as const,
            originalIntent: '待接入 Prompt Confirmation Payload',
            visualProposal: `占位 Payload：${message.payloadId}`,
            executionPrompt: '后续在 M4 接入真实 prompt 对比内容。',
          }
        }

        return {
          id: message.id,
          type: 'message' as const,
          role: toConversationRole(message),
          text: message.text,
          timestamp: new Date(message.createdAt).toLocaleTimeString(),
        }
      }),
    [messages, status],
  )

  const modeLabel = {
    create: '开始搭建',
    update: '修改当前工作流',
    diagnose: '诊断问题',
    optimize: '优化当前流程',
  }[mode]

  const quickActions = [
    { id: 'more-realistic', label: '改成更写实' },
    { id: 'add-style-step', label: '加一个风格分析节点' },
    { id: 'generate-variants', label: '生成 4 个变体' },
  ]

  /* ── 从 API 数据注入 FlowStore ──────────────────────── */
  useEffect(() => {
    if (hasLoaded.current || isLoading) return
    if (!data) return
    hasLoaded.current = true

    const raw = (data as Record<string, unknown>).data as string | undefined
    if (!raw || raw === '{}') return

    try {
      const parsed = JSON.parse(raw)
      const { nodes, edges, viewport } = deserializeWorkflow(parsed)
      useFlowStore.getState().setFlow(nodes, edges, viewport)
    } catch {
      /* 解析失败时从空画布开始 */
    }
  }, [data, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* 移动端提示 (< lg) */}
      <MobileGuard />

      {/* 画布编辑器 (lg+) */}
      <div className="hidden h-full lg:block">
        <ReactFlowProvider>
          <div className="flex h-full">
            <div className="min-w-0 flex-1">
              <Canvas workflowId={id} canEdit={canEdit} />
            </div>
            <AgentPanel
              className="w-[320px] xl:w-[360px]"
              header={(
                <AgentHeader
                  title="Agent"
                  modeLabel={modeLabel}
                  contextLabel="已连接到当前画板，后续会基于左侧工作流生成提案。"
                />
              )}
              conversation={(
                <AgentConversation
                  items={conversationItems}
                  emptyState="告诉我你想搭建什么工作流，我会先在右侧生成提案，再把结果落到左侧画板。"
                />
              )}
              quickActions={(
                <AgentQuickActions
                  actions={quickActions}
                  onSelect={(actionId) => {
                    appendMessage({
                      id: crypto.randomUUID(),
                      role: 'process',
                      text: `已选择快捷建议：${actionId}`,
                      createdAt: new Date().toISOString(),
                    })
                  }}
                />
              )}
              composer={(
                <AgentComposer
                  hint="当前先接入 M1 骨架；后续会在 M2 把输入真正串到结构化提案链路。"
                  submitLabel={t('run')}
                  onSubmit={(value) => {
                    appendMessage({
                      id: crypto.randomUUID(),
                      role: 'user',
                      text: value,
                      createdAt: new Date().toISOString(),
                    })
                    appendMessage({
                      id: crypto.randomUUID(),
                      role: 'process',
                      text: '我先理解一下你的目标。',
                      createdAt: new Date().toISOString(),
                    })
                  }}
                />
              )}
            />
          </div>
        </ReactFlowProvider>
      </div>
    </>
  )
}

function toConversationRole(
  message: Extract<
    AgentMessage,
    { role: 'user' | 'assistant' | 'diagnosis' }
  >,
): 'user' | 'assistant' | 'diagnosis' {
  return message.role
}

/* ─── Mobile Guard ──────────────────────────────────── */

function MobileGuard() {
  const t = useTranslations('canvas')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center lg:hidden">
      <Monitor size={48} className="text-muted-foreground" />
      <h2 className="text-lg font-medium">{t('desktopOnly')}</h2>
      <p className="text-sm text-muted-foreground">{t('desktopOnlyDesc')}</p>
    </div>
  )
}
