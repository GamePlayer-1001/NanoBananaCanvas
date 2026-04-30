/**
 * [INPUT]: 依赖 next/dynamic 的客户端动态导入，依赖 @/components/canvas/canvas，
 *          依赖 @/components/agent/* 的 M1 面板骨架，
 *          依赖 @/hooks/use-agent-session 的 M2 提案链路，
 *          依赖 @/hooks/use-workflows 的 useWorkflow 数据获取，
 *          依赖 @/stores/use-flow-store 的 setFlow 注入画布数据，
 *          依赖 @/stores/use-agent-store 的会话与待确认计划，
 *          依赖 @/services/storage/serializer 的反序列化，
 *          依赖 lucide-react 的 Loader2
 * [OUTPUT]: 对外提供全屏画布编辑器页面 (CSR)
 * [POS]: (editor)/canvas/[id] 路由，全屏无侧边栏，从 D1 加载工作流数据注入 FlowStore，并在右侧挂载 Agent 提案面板
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
import { useAgentSession } from '@/hooks/use-agent-session'
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
  const { locale, id } = use(params)
  const t = useTranslations('canvas')
  const { data, isLoading } = useWorkflow(id)
  const hasLoaded = useRef(false)
  const canEdit = (data as Record<string, unknown> | undefined)?.canEdit === true
  const messages = useAgentStore((state) => state.messages)
  const mode = useAgentStore((state) => state.mode)
  const status = useAgentStore((state) => state.status)
  const pendingPlan = useAgentStore((state) => state.pendingPlan)
  const promptConfirmation = useAgentStore((state) => state.promptConfirmation)
  const errorMessage = useAgentStore((state) => state.errorMessage)
  const workflowName =
    typeof (data as Record<string, unknown> | undefined)?.name === 'string'
      ? String((data as Record<string, unknown>).name)
      : undefined
  const { sendMessage, isSubmitting } = useAgentSession({
    workflowId: id,
    workflowName,
    locale,
  })

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
          const changes = pendingPlan?.id === message.planId
            ? pendingPlan.operations.map((operation) => ({
                label: toOperationLabel(operation.type),
                detail: toOperationDetail(operation),
                risk: toOperationRisk(operation.type),
              }))
            : []

          return {
            id: message.id,
            type: 'proposal' as const,
            title: '工作流提案',
            summary:
              pendingPlan?.id === message.planId
                ? pendingPlan.summary
                : `提案 ID：${message.planId}`,
            reasons: pendingPlan?.id === message.planId ? pendingPlan.reasons : [],
            changes,
            requiresConfirmation:
              pendingPlan?.id === message.planId
                ? pendingPlan.requiresConfirmation
                : false,
          }
        }

        if (message.role === 'prompt-confirmation') {
          return {
            id: message.id,
            type: 'prompt-confirmation' as const,
            originalIntent:
              promptConfirmation?.id === message.payloadId
                ? promptConfirmation.originalIntent
                : '待接入 Prompt Confirmation Payload',
            visualProposal:
              promptConfirmation?.id === message.payloadId
                ? promptConfirmation.visualProposal
                : `占位 Payload：${message.payloadId}`,
            executionPrompt:
              promptConfirmation?.id === message.payloadId
                ? promptConfirmation.executionPrompt
                : '后续在 M4 接入真实 prompt 对比内容。',
            styleOptions:
              promptConfirmation?.id === message.payloadId
                ? promptConfirmation.styleOptions?.map((item) => item.label)
                : [],
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
    [messages, pendingPlan, promptConfirmation, status],
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
                  contextLabel={
                    errorMessage
                      ? `上一次提案失败：${errorMessage}`
                      : '已连接到当前画板，我会先基于左侧工作流给出结构化提案。'
                  }
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
                    const actionMap: Record<string, string> = {
                      'more-realistic': '把当前工作流改成更写实的方向',
                      'add-style-step': '帮我补一个风格分析节点',
                      'generate-variants': '基于当前思路生成 4 个变体方案',
                    }
                    void sendMessage(actionMap[actionId] ?? actionId)
                  }}
                />
              )}
              composer={(
                <AgentComposer
                  disabled={isSubmitting}
                  hint={
                    isSubmitting
                      ? '我正在整理画板并生成提案，请稍等。'
                      : '右侧输入会先生成结构化提案，不会直接改左侧画板。'
                  }
                  submitLabel={t('run')}
                  onSubmit={(value) => void sendMessage(value)}
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

function toOperationLabel(type: string) {
  const labels: Record<string, string> = {
    add_node: '新增节点',
    update_node_data: '修改节点配置',
    remove_node: '删除节点',
    connect: '新增连线',
    disconnect: '移除连线',
    focus_nodes: '聚焦节点',
    request_prompt_confirmation: '提示词确认',
    run_workflow: '执行工作流',
  }

  return labels[type] ?? type
}

function toOperationDetail(
  operation: NonNullable<ReturnType<typeof useAgentStore.getState>['pendingPlan']>['operations'][number],
) {
  switch (operation.type) {
    case 'add_node':
      return `计划新增 1 个 ${operation.nodeType} 节点`
    case 'update_node_data':
      return `计划调整节点 ${operation.nodeId} 的局部配置`
    case 'remove_node':
      return `计划删除节点 ${operation.nodeId}`
    case 'connect':
      return `计划连接 ${operation.source} -> ${operation.target}`
    case 'disconnect':
      return `计划移除连线 ${operation.edgeId}`
    case 'focus_nodes':
      return `计划先聚焦 ${operation.nodeIds.length} 个相关节点`
    case 'request_prompt_confirmation':
      return '这一步会先进入提示词确认，不会直接改图'
    case 'run_workflow':
      return operation.scope === 'from-node'
        ? `计划从节点 ${operation.nodeId ?? '-'} 开始执行`
        : '计划执行当前工作流'
  }
}

function toOperationRisk(type: string): 'low' | 'medium' | 'high' {
  if (type === 'remove_node' || type === 'run_workflow') return 'high'
  if (type === 'request_prompt_confirmation' || type === 'update_node_data') return 'medium'
  return 'low'
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
