/**
 * [INPUT]: 依赖 next/dynamic 的客户端动态导入，依赖 @/components/canvas/canvas，
 *          依赖 @/components/agent/* 的 Agent 面板组件，
 *          依赖 @/hooks/use-agent-session 与 @/hooks/use-agent-task-summary，
 *          依赖 @/hooks/use-workflows 的 useWorkflow 数据获取，
 *          依赖 @/stores/use-flow-store / use-agent-store / use-workflow-metadata-store，
 *          依赖 @/services/storage/serializer 的反序列化，
 *          依赖 lucide-react 的 Loader2
 * [OUTPUT]: 对外提供全屏画布编辑器页面 (CSR)
 * [POS]: (editor)/canvas/[id] 路由，全屏无侧边栏，从 D1 加载工作流数据注入 FlowStore，并在右侧挂载 Agent 提案/诊断/执行联动面板
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
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
import { useAgentTaskSummary } from '@/hooks/use-agent-task-summary'
import { useWorkflow } from '@/hooks/use-workflows'
import type { AgentMessage } from '@/stores/use-agent-store'
import { useAgentStore } from '@/stores/use-agent-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { useWorkflowMetadataStore } from '@/stores/use-workflow-metadata-store'
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
  const tAgent = useTranslations('agentPanel')
  const { data, isLoading } = useWorkflow(id)
  const hasLoaded = useRef(false)
  const lastExecutionLabelRef = useRef<string | null>(null)
  const lastActiveTaskLabelRef = useRef<string | null>(null)
  const emittedTerminalTaskIdsRef = useRef<Set<string>>(new Set())
  const canEdit = (data as Record<string, unknown> | undefined)?.canEdit === true
  const messages = useAgentStore((state) => state.messages)
  const mode = useAgentStore((state) => state.mode)
  const status = useAgentStore((state) => state.status)
  const pendingPlan = useAgentStore((state) => state.pendingPlan)
  const promptConfirmation = useAgentStore((state) => state.promptConfirmation)
  const errorMessage = useAgentStore((state) => state.errorMessage)
  const lastAppliedPlanId = useAgentStore((state) => state.lastAppliedPlanId)
  const appendMessage = useAgentStore((state) => state.appendMessage)
  const template = useWorkflowMetadataStore((state) => state.template)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const workflowName =
    typeof (data as Record<string, unknown> | undefined)?.name === 'string'
      ? String((data as Record<string, unknown>).name)
      : undefined
  const {
    sendMessage,
    isSubmitting,
    applyPendingPlan,
    rejectPendingPlan,
    isApplying,
    regeneratePrompt,
    confirmPromptAndRun,
  } = useAgentSession({
    workflowId: id,
    workflowName,
    locale,
  })
  const {
    executionLabel,
    activeTaskLabel,
    terminalEvents,
  } = useAgentTaskSummary({
    workflowId: id,
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
            title: tAgent('proposalTitle'),
            sourceLabel:
              pendingPlan?.id === message.planId && pendingPlan.mode === 'template'
                ? tAgent('proposalSourceTemplate')
                : undefined,
            summary:
              pendingPlan?.id === message.planId
                ? pendingPlan.summary
                : tAgent('proposalFallback', { planId: message.planId }),
            reasons: pendingPlan?.id === message.planId ? pendingPlan.reasons : [],
            changes,
            requiresConfirmation:
              pendingPlan?.id === message.planId
                ? pendingPlan.requiresConfirmation
                : false,
          }
        }

        if (message.role === 'template-context') {
          return {
            id: message.id,
            type: 'message' as const,
            role: 'assistant' as const,
            text: message.text,
            timestamp: new Date(message.createdAt).toLocaleTimeString(),
          }
        }

        if (message.role === 'prompt-confirmation') {
          return {
            id: message.id,
            type: 'prompt-confirmation' as const,
            payloadId: message.payloadId,
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
            expanded: expandedPromptId === message.payloadId,
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
    [expandedPromptId, messages, pendingPlan, promptConfirmation, status, tAgent],
  )

  const modeLabel = {
    create: tAgent('modeCreate'),
    update: tAgent('modeUpdate'),
    repair: tAgent('modeUpdate'),
    diagnose: tAgent('modeDiagnose'),
    optimize: tAgent('modeOptimize'),
    extend: tAgent('modeUpdate'),
    template: tAgent('modeCreate'),
  }[mode]

  const quickActions = [
    { id: 'diagnose', label: tAgent('quickDiagnose') },
    { id: 'explain', label: tAgent('quickExplain') },
    { id: 'optimize', label: tAgent('quickOptimize') },
    { id: 'more-realistic', label: tAgent('quickRealistic') },
    ...(template
      ? [
          {
            id: 'template-adapt',
            label: tAgent('quickTemplateAdapt'),
            accent: 'template' as const,
          },
        ]
      : []),
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
      const { nodes, edges, viewport, template, auditTrail } = deserializeWorkflow(parsed)
      useFlowStore.getState().setFlow(nodes, edges, viewport)
      useWorkflowMetadataStore.getState().setTemplate(template ?? null)
      useWorkflowMetadataStore.getState().setAuditTrail(auditTrail ?? [])
    } catch {
      /* 解析失败时从空画布开始 */
    }
  }, [data, isLoading])

  useEffect(() => {
    if (!executionLabel) return
    if (lastExecutionLabelRef.current === executionLabel) return
    lastExecutionLabelRef.current = executionLabel

    appendMessage({
      id: crypto.randomUUID(),
      role: 'process',
      text: executionLabel,
      createdAt: new Date().toISOString(),
    })
  }, [appendMessage, executionLabel])

  useEffect(() => {
    if (!activeTaskLabel) return
    if (lastActiveTaskLabelRef.current === activeTaskLabel) return
    lastActiveTaskLabelRef.current = activeTaskLabel

    appendMessage({
      id: crypto.randomUUID(),
      role: 'process',
      text: activeTaskLabel,
      createdAt: new Date().toISOString(),
    })
  }, [activeTaskLabel, appendMessage])

  useEffect(() => {
    if (terminalEvents.length === 0) return

    for (const event of terminalEvents) {
      if (emittedTerminalTaskIdsRef.current.has(event.taskId)) continue
      emittedTerminalTaskIdsRef.current.add(event.taskId)
      if (event.tone === 'diagnosis') {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'diagnosis',
          severity: 'warning',
          text: event.message,
          createdAt: new Date().toISOString(),
        })
      } else {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: event.message,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }, [appendMessage, terminalEvents])

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
                  title={tAgent('title')}
                  modeLabel={modeLabel}
                  contextLabel={
                    errorMessage
                      ? tAgent('contextError', { message: errorMessage })
                      : activeTaskLabel
                        ? activeTaskLabel
                      : executionLabel
                        ? executionLabel
                      : promptConfirmation
                        ? tAgent('contextPromptConfirm')
                      : template
                        ? `当前模板：${template.name}`
                      : pendingPlan
                        ? tAgent('contextPlanReady')
                        : lastAppliedPlanId
                          ? tAgent('contextLastApplied', { planId: lastAppliedPlanId })
                          : tAgent('contextConnected')
                  }
                  actionLabel={
                    pendingPlan && !promptConfirmation
                      ? (isApplying ? tAgent('actionApplying') : tAgent('actionApply'))
                      : undefined
                  }
                  onAction={
                    pendingPlan && !promptConfirmation ? () => void applyPendingPlan() : undefined
                  }
                  secondaryActionLabel={pendingPlan ? tAgent('actionReject') : undefined}
                  onSecondaryAction={pendingPlan ? rejectPendingPlan : undefined}
                />
              )}
              conversation={(
                <AgentConversation
                  items={conversationItems}
                  emptyState={tAgent('emptyState')}
                  onPromptConfirm={(payloadId) => void confirmPromptAndRun(payloadId)}
                  onPromptRegenerate={(payloadId) => void regeneratePrompt(payloadId)}
                  onPromptManualEdit={(payloadId) => {
                    setExpandedPromptId(payloadId ?? null)
                    void rejectPendingPlan()
                  }}
                  onPromptToggleExpand={(payloadId) =>
                    setExpandedPromptId((current) => (current === payloadId ? null : payloadId ?? null))
                  }
                  onPromptStyleSelect={(payloadId, styleLabel) => void regeneratePrompt(payloadId, styleLabel)}
                />
              )}
              quickActions={(
                <AgentQuickActions
                  actions={pendingPlan ? [] : quickActions}
                  onSelect={(actionId) => {
                    const actionMap: Record<string, string> = {
                      diagnose: tAgent('quickDiagnoseAsk'),
                      explain: tAgent('quickExplainAsk'),
                      optimize: tAgent('quickOptimizeAsk'),
                      'more-realistic': tAgent('quickRealisticAsk'),
                      'template-adapt': tAgent('quickTemplateAdaptAsk', {
                        name: template?.name ?? '当前模板',
                      }),
                    }
                    void sendMessage(actionMap[actionId] ?? actionId)
                  }}
                />
              )}
              composer={(
                <AgentComposer
                  disabled={isSubmitting || isApplying}
                  hint={
                    isApplying
                      ? tAgent('hintApplying')
                      : isSubmitting
                      ? tAgent('hintSubmitting')
                      : tAgent('hintIdle')
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
    insert_between: '插入中间步骤',
    replace_node: '替换节点模型',
    duplicate_node_branch: '复制变体分支',
    batch_update_node_data: '批量更新参数',
    relabel_node: '重命名节点',
    annotate_change: '记录改动说明',
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
    case 'insert_between':
      return `计划在 ${operation.source} 和 ${operation.target} 之间插入 ${operation.nodeType}`
    case 'replace_node':
      return `计划将节点 ${operation.nodeId} 切换为 ${operation.nextNodeType} 方案`
    case 'duplicate_node_branch':
      return `计划从节点 ${operation.nodeId} 复制 ${operation.count} 条变体支线`
    case 'batch_update_node_data':
      return `计划批量更新 ${operation.nodeIds.length} 个节点`
    case 'relabel_node':
      return `计划将节点 ${operation.nodeId} 重命名为 ${operation.label}`
    case 'annotate_change':
      return `计划为节点 ${operation.nodeId} 追加改动说明`
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
  if (
    type === 'remove_node' ||
    type === 'run_workflow' ||
    type === 'replace_node' ||
    type === 'duplicate_node_branch'
  ) {
    return 'high'
  }
  if (
    type === 'request_prompt_confirmation' ||
    type === 'update_node_data' ||
    type === 'insert_between' ||
    type === 'batch_update_node_data'
  ) {
    return 'medium'
  }
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
