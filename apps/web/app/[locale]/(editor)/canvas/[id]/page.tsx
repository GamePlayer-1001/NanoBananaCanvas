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
import { AgentChangeLogSheet } from '@/components/agent/agent-change-log-sheet'
import { AgentPanel } from '@/components/agent/agent-panel'
import { AgentQuickActions } from '@/components/agent/agent-quick-actions'
import { useModelConfigs } from '@/hooks/use-model-configs'
import { useAgentSelectionContext } from '@/hooks/use-agent-selection-context'
import { useAgentSession } from '@/hooks/use-agent-session'
import { useAgentTaskSummary } from '@/hooks/use-agent-task-summary'
import { useWorkflow } from '@/hooks/use-workflows'
import { fetchLatestAgentReplay } from '@/lib/agent/agent-audit'
import { summarizeCanvas } from '@/lib/agent/summarize-canvas'
import { getAgentPlatformModelOptions } from '@/lib/platform-models'
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
  const lastSessionWorkflowIdRef = useRef<string | null>(null)
  const lastExecutionLabelRef = useRef<string | null>(null)
  const lastActiveTaskLabelRef = useRef<string | null>(null)
  const emittedTerminalTaskIdsRef = useRef<Set<string>>(new Set())
  const canEdit = (data as Record<string, unknown> | undefined)?.canEdit === true
  const messages = useAgentStore((state) => state.messages)
  const setMode = useAgentStore((state) => state.setMode)
  const resetSession = useAgentStore((state) => state.resetSession)
  const status = useAgentStore((state) => state.status)
  const pendingPlan = useAgentStore((state) => state.pendingPlan)
  const lastAppliedPlanId = useAgentStore((state) => state.lastAppliedPlanId)
  const appendMessage = useAgentStore((state) => state.appendMessage)
  const template = useWorkflowMetadataStore((state) => state.template)
  const auditTrail = useWorkflowMetadataStore((state) => state.auditTrail)
  const nodes = useFlowStore((state) => state.nodes)
  const edges = useFlowStore((state) => state.edges)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [isChangeLogOpen, setIsChangeLogOpen] = useState(false)
  const [changeLogItems, setChangeLogItems] = useState<string[]>([])
  const [composerExecutionMode, setComposerExecutionMode] = useState<'platform' | 'user_key'>('platform')
  const [composerModel, setComposerModel] = useState<string>('instant')
  const workflowName =
    typeof (data as Record<string, unknown> | undefined)?.name === 'string'
      ? String((data as Record<string, unknown>).name)
      : undefined
  const {
    sendMessage,
    isSubmitting,
    isApplying,
    regeneratePrompt,
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
  const { getConfigsByCapability } = useModelConfigs()
  const resultAwareSummary = useMemo(
    () =>
      summarizeCanvas({
        workflowId: id,
        workflowName,
        nodes,
        edges,
        template: template ?? undefined,
        auditTrail,
      }),
    [auditTrail, edges, id, nodes, template, workflowName],
  )
  const platformModelOptions = useMemo(() => getAgentPlatformModelOptions(), [])
  const modelOptions = useMemo(() => {
    if (composerExecutionMode === 'user_key') {
      return getConfigsByCapability('text').map((item) => ({
        value: item.configId,
        label: item.label ?? item.modelId ?? item.providerId ?? item.configId,
      }))
    }

    return platformModelOptions
  }, [composerExecutionMode, getConfigsByCapability, platformModelOptions])
  const resolvedComposerModel = useMemo(() => {
    if (modelOptions.some((item) => item.value === composerModel)) {
      return composerModel
    }
    return modelOptions[0]?.value ?? 'instant'
  }, [composerModel, modelOptions])
  const resolvedPlatformOption = useMemo(
    () =>
      composerExecutionMode === 'platform'
        ? platformModelOptions.find((item) => item.value === resolvedComposerModel)
        : undefined,
    [composerExecutionMode, platformModelOptions, resolvedComposerModel],
  )

  useAgentSelectionContext({
    workflowId: id,
    workflowName,
  })

  useEffect(() => {
    if (lastSessionWorkflowIdRef.current === id) {
      return
    }

    lastSessionWorkflowIdRef.current = id
    resetSession()
    // 把进入页面时已经存在的执行/任务摘要当作基线，避免旧状态被重新灌回新会话。
    lastExecutionLabelRef.current = executionLabel
    lastActiveTaskLabelRef.current = activeTaskLabel
    emittedTerminalTaskIdsRef.current = new Set(terminalEvents.map((event) => event.taskId))
  }, [activeTaskLabel, executionLabel, id, resetSession, terminalEvents])

  useEffect(() => {
    let cancelled = false

    void fetchLatestAgentReplay(id)
      .then((payload) => {
        if (cancelled) return
        const replay = (payload as { data?: { replay?: { replaySnapshot?: { changeSummary?: string } } } }).data?.replay
        const summary = replay?.replaySnapshot?.changeSummary
        setChangeLogItems(summary ? [summary] : [])
      })
      .catch(() => {
        if (!cancelled) {
          setChangeLogItems([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, lastAppliedPlanId])

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
          const summary =
            pendingPlan?.id === message.planId
              ? pendingPlan.summary
              : tAgent('proposalFallback', { planId: message.planId })
          return {
            id: message.id,
            type: 'message' as const,
            role: 'assistant' as const,
            text: summary,
            timestamp: new Date(message.createdAt).toLocaleTimeString(),
          }
        }

        if (message.role === 'proposal-comparison') {
          return {
            id: message.id,
            type: 'message' as const,
            role: 'assistant' as const,
            text: tAgent('messageMultipleDirections'),
            timestamp: new Date(message.createdAt).toLocaleTimeString(),
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
            originalIntent: message.payload.originalIntent,
            visualProposal: message.payload.visualProposal,
            executionPrompt: message.payload.executionPrompt,
            styleOptions: message.payload.styleOptions?.map((item) => item.label) ?? [],
            expanded: expandedPromptId === message.payloadId,
          }
        }

        if (message.role === 'user' || message.role === 'assistant' || message.role === 'diagnosis') {
          return {
            id: message.id,
            type: 'message' as const,
            role: toConversationRole(message),
            text: message.text,
            attachments: 'attachments' in message ? message.attachments : undefined,
            timestamp: new Date(message.createdAt).toLocaleTimeString(),
          }
        }

        throw new Error(`Unhandled agent message role: ${String((message as { role?: string }).role)}`)
      }),
    [
      expandedPromptId,
      messages,
      pendingPlan,
      status,
      tAgent,
    ],
  )

  const quickActions = [
    ...(resultAwareSummary.latestSuccessfulAsset
      ? [{ id: 'continue-from-result', label: tAgent('quickContinueFromResult') }]
      : []),
    { id: 'diagnose', label: tAgent('quickDiagnose') },
    { id: 'explain', label: tAgent('quickExplain') },
    { id: 'optimize', label: tAgent('quickOptimize') },
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
  const heroActions = [
    { id: 'hero-cat-image', label: tAgent('heroCatImage'), accent: 'hero' as const },
    { id: 'hero-realistic-edit', label: tAgent('heroRealisticEdit'), accent: 'hero' as const },
    { id: 'hero-diagnose', label: tAgent('heroDiagnose'), accent: 'hero' as const },
    { id: 'hero-explain', label: tAgent('heroExplain'), accent: 'hero' as const },
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
          <div className="relative h-full">
            <Canvas workflowId={id} canEdit={canEdit} />
            <AgentPanel
              className="w-[400px]"
              conversation={(
                <AgentConversation
                  items={conversationItems}
                  emptyState={tAgent('emptyState')}
                  hero={(
                    <div className="flex h-full min-h-[320px] w-full items-center justify-center px-8 text-center">
                      <div className="space-y-0">
                        <h3 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] text-slate-950">
                          {tAgent('heroTitle')}
                        </h3>
                      </div>
                    </div>
                  )}
                  onPromptRegenerate={(payloadId) => void regeneratePrompt(payloadId)}
                  onPromptManualEdit={(payloadId) => {
                    setExpandedPromptId(payloadId ?? null)
                  }}
                  onPromptToggleExpand={(payloadId) =>
                    setExpandedPromptId((current) => (current === payloadId ? null : payloadId ?? null))
                  }
                  onPromptStyleSelect={(payloadId, styleLabel) => void regeneratePrompt(payloadId, styleLabel)}
                />
              )}
              quickActions={(
                <AgentQuickActions
                  title={messages.length > 0 ? tAgent('quickActionsTitle') : undefined}
                  compact
                  actions={
                    pendingPlan
                      ? []
                      : messages.length === 0
                        ? heroActions
                        : quickActions
                  }
                  onSelect={(actionId) => {
                    const actionMap: Record<string, string> = {
                      'hero-cat-image': tAgent('heroCatImageAsk'),
                      'hero-realistic-edit': tAgent('heroRealisticEditAsk'),
                      'hero-diagnose': tAgent('heroDiagnoseAsk'),
                      'hero-explain': tAgent('heroExplainAsk'),
                      'continue-from-result': tAgent('quickContinueFromResultAsk', {
                        asset:
                          resultAwareSummary.latestSuccessfulAsset?.kind === 'image'
                            ? tAgent('resultAssetImage')
                            : resultAwareSummary.latestSuccessfulAsset?.kind === 'video'
                              ? tAgent('resultAssetVideo')
                              : resultAwareSummary.latestSuccessfulAsset?.kind === 'audio'
                                ? tAgent('resultAssetAudio')
                                : tAgent('resultAssetText'),
                      }),
                      diagnose: tAgent('quickDiagnoseAsk'),
                      explain: tAgent('quickExplainAsk'),
                      optimize: tAgent('quickOptimizeAsk'),
                      'template-adapt': tAgent('quickTemplateAdaptAsk', {
                        name: template?.name ?? '当前模板',
                      }),
                    }
                    if (actionId === 'hero-cat-image') setMode('create')
                    if (actionId === 'hero-realistic-edit') setMode('update')
                    if (actionId === 'hero-diagnose') setMode('diagnose')
                    if (actionId === 'hero-explain') setMode('update')
                    if (actionId === 'diagnose') setMode('diagnose')
                    if (actionId === 'optimize') setMode('optimize')
                    if (actionId === 'explain') setMode('update')
                    void sendMessage(
                      actionMap[actionId] ?? actionId,
                      {
                        executionMode: composerExecutionMode,
                        modelId:
                          composerExecutionMode === 'platform' ? resolvedComposerModel : undefined,
                        provider:
                          composerExecutionMode === 'platform'
                            ? resolvedPlatformOption?.provider
                            : undefined,
                        configId:
                          composerExecutionMode === 'user_key' ? resolvedComposerModel : undefined,
                      },
                      [],
                    )
                  }}
                />
              )}
              composer={(
                <AgentComposer
                  disabled={isSubmitting || isApplying}
                  modelOptions={modelOptions}
                  modelValue={resolvedComposerModel}
                  onModelChange={setComposerModel}
                  executionMode={composerExecutionMode}
                  onExecutionModeChange={setComposerExecutionMode}
                  hint={
                    isApplying
                      ? tAgent('hintApplying')
                      : isSubmitting
                      ? tAgent('hintSubmitting')
                      : tAgent('hintIdle')
                  }
                  submitLabel={t('run')}
                  onSubmit={(value, attachments) =>
                    void sendMessage(
                      value,
                      {
                        executionMode: composerExecutionMode,
                        modelId:
                          composerExecutionMode === 'platform' ? resolvedComposerModel : undefined,
                        provider:
                          composerExecutionMode === 'platform'
                            ? resolvedPlatformOption?.provider
                            : undefined,
                        configId:
                          composerExecutionMode === 'user_key' ? resolvedComposerModel : undefined,
                      },
                      attachments,
                    )
                  }
                />
              )}
            />
          </div>
          <AgentChangeLogSheet
            open={isChangeLogOpen}
            onOpenChange={setIsChangeLogOpen}
            title={tAgent('changeLogTitle')}
            description={tAgent('changeLogDescription')}
            changes={changeLogItems}
          />
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
