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
import { CheckCircle2, ChevronDown, History, Loader2, Sparkles, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactFlowProvider } from '@xyflow/react'
import { AgentComposer } from '@/components/agent/agent-composer'
import { AgentConversation } from '@/components/agent/agent-conversation'
import { AgentChangeLogSheet } from '@/components/agent/agent-change-log-sheet'
import { AgentHeader } from '@/components/agent/agent-header'
import { AgentPanel } from '@/components/agent/agent-panel'
import { AgentQuickActions } from '@/components/agent/agent-quick-actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useModelConfigs } from '@/hooks/use-model-configs'
import { useAgentSelectionContext } from '@/hooks/use-agent-selection-context'
import { useAgentSession } from '@/hooks/use-agent-session'
import { useAgentTaskSummary } from '@/hooks/use-agent-task-summary'
import { primeCloudSaveBaseline } from '@/hooks/use-auto-save'
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

const EMPTY_VIEWPORT = { x: 0, y: 0, zoom: 1 } as const
const AGENT_HISTORY_STORAGE_KEY = 'nbc:agent-history:v1'
const AGENT_HISTORY_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000
const AGENT_HISTORY_MAX_ITEMS_PER_WORKFLOW = 12

function buildStableWorkflowBaseline(input: {
  name?: string
  nodes?: unknown[]
  edges?: unknown[]
  viewport?: unknown
  template?: unknown
  auditTrail?: unknown
}) {
  return JSON.stringify(
    {
      version: 1,
      name: input.name ?? 'Untitled Workflow',
      nodes: input.nodes ?? [],
      edges: input.edges ?? [],
      viewport: input.viewport ?? EMPTY_VIEWPORT,
      template: input.template,
      auditTrail: input.auditTrail,
    },
    (key, value) => (key === 'savedAt' ? undefined : value),
  )
}

type AgentHistoryStatus = 'completed' | 'failed' | 'in_progress'

interface AgentHistoryItem {
  id: string
  workflowId: string
  workflowName?: string
  userMessage: string
  assistantSummary: string
  status: AgentHistoryStatus
  createdAt: string
}

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
  const loadedWorkflowIdRef = useRef<string | null>(null)
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
  const nodeCount = useFlowStore((state) => state.nodes.length)
  const edgeCount = useFlowStore((state) => state.edges.length)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [isChangeLogOpen, setIsChangeLogOpen] = useState(false)
  const [changeLogItems, setChangeLogItems] = useState<string[]>([])
  const [composerExecutionMode, setComposerExecutionMode] = useState<'platform' | 'user_key'>('platform')
  const [composerModel, setComposerModel] = useState<string>('instant')
  const [historyItems, setHistoryItems] = useState<AgentHistoryItem[]>([])
  const [activeHistoryItemId, setActiveHistoryItemId] = useState<string | null>(null)
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
        template: template ?? undefined,
        auditTrail,
      }),
    [auditTrail, edgeCount, id, nodeCount, template, workflowName],
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
    loadedWorkflowIdRef.current = null
    useFlowStore.getState().setFlow([], [], EMPTY_VIEWPORT)
    useWorkflowMetadataStore.getState().setTemplate(null)
    useWorkflowMetadataStore.getState().setAuditTrail([])
    resetSession()
    setActiveHistoryItemId(null)
    setHistoryItems(readAgentHistory(id))
    // 把进入页面时已经存在的执行/任务摘要当作基线，避免旧状态被重新灌回新会话。
    lastExecutionLabelRef.current = executionLabel
    lastActiveTaskLabelRef.current = activeTaskLabel
    emittedTerminalTaskIdsRef.current = new Set(terminalEvents.map((event) => event.taskId))
  }, [activeTaskLabel, executionLabel, id, resetSession, terminalEvents])

  useEffect(() => {
    setHistoryItems(readAgentHistory(id))
  }, [id])

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
            variant: 'confirmation' as const,
            payloadId: message.payloadId,
            originalIntent: message.payload.originalIntent,
            visualProposal: message.payload.visualProposal,
            executionPrompt: message.payload.executionPrompt,
            styleOptions: message.payload.styleOptions?.map((item) => item.label) ?? [],
            expanded: expandedPromptId === message.payloadId,
          }
        }

        if (message.role === 'prompt-result') {
          return {
            id: message.id,
            type: 'prompt-confirmation' as const,
            variant: 'result' as const,
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
    { id: 'hero-workflow', label: tAgent('heroWorkflowCommand'), accent: 'hero' as const },
    { id: 'hero-prompt', label: tAgent('heroPromptCommand'), accent: 'hero' as const },
    { id: 'hero-chat', label: tAgent('heroChatMode'), accent: 'hero' as const },
  ]
  /* ── 从 API 数据注入 FlowStore ──────────────────────── */
  useEffect(() => {
    if (isLoading) return
    if (!data) return
    if (loadedWorkflowIdRef.current === id) return

    loadedWorkflowIdRef.current = id

    const raw = (data as Record<string, unknown>).data as string | undefined
    if (!raw || raw === '{}') {
      useFlowStore.getState().setFlow([], [], EMPTY_VIEWPORT)
      useWorkflowMetadataStore.getState().setTemplate(null)
      useWorkflowMetadataStore.getState().setAuditTrail([])
      primeCloudSaveBaseline(
        buildStableWorkflowBaseline({
          name: workflowName,
          nodes: [],
          edges: [],
          viewport: EMPTY_VIEWPORT,
        }),
      )
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const { nodes, edges, viewport, template, auditTrail } = deserializeWorkflow(parsed)
      useFlowStore.getState().setFlow(nodes, edges, viewport)
      useWorkflowMetadataStore.getState().setTemplate(template ?? null)
      useWorkflowMetadataStore.getState().setAuditTrail(auditTrail ?? [])
      primeCloudSaveBaseline(
        buildStableWorkflowBaseline({
          name: workflowName,
          nodes,
          edges,
          viewport,
          template,
          auditTrail,
        }),
      )
    } catch {
      useFlowStore.getState().setFlow([], [], EMPTY_VIEWPORT)
      useWorkflowMetadataStore.getState().setTemplate(null)
      useWorkflowMetadataStore.getState().setAuditTrail([])
      primeCloudSaveBaseline(
        buildStableWorkflowBaseline({
          name: workflowName,
          nodes: [],
          edges: [],
          viewport: EMPTY_VIEWPORT,
        }),
      )
    }
  }, [data, id, isLoading, workflowName])

  useEffect(() => {
    if (!executionLabel) return
    if (lastExecutionLabelRef.current === executionLabel) return
    lastExecutionLabelRef.current = executionLabel

    if (messages.length === 0) {
      return
    }

    appendMessage({
      id: crypto.randomUUID(),
      role: 'process',
      text: executionLabel,
      createdAt: new Date().toISOString(),
    })
  }, [appendMessage, executionLabel, messages.length])

  useEffect(() => {
    if (!activeTaskLabel) return
    if (lastActiveTaskLabelRef.current === activeTaskLabel) return
    lastActiveTaskLabelRef.current = activeTaskLabel

    if (messages.length > 0) {
      appendMessage({
        id: crypto.randomUUID(),
        role: 'process',
        text: activeTaskLabel,
        createdAt: new Date().toISOString(),
      })
    }
  }, [activeTaskLabel, appendMessage, messages.length])

  useEffect(() => {
    if (terminalEvents.length === 0) return

    for (const event of terminalEvents) {
      if (emittedTerminalTaskIdsRef.current.has(event.taskId)) continue
      emittedTerminalTaskIdsRef.current.add(event.taskId)
      if (messages.length === 0) {
        continue
      }
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
  }, [appendMessage, messages.length, terminalEvents])

  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    const snapshot = buildAgentHistorySnapshot({
      workflowId: id,
      workflowName,
      messages,
      status,
    })

    if (!snapshot) {
      return
    }

    const nextItems = writeAgentHistory(snapshot)
    setHistoryItems(nextItems.filter((item) => item.workflowId === id))
  }, [id, messages, status, workflowName])

  const activeHistoryItem = useMemo(
    () => historyItems.find((item) => item.id === activeHistoryItemId) ?? null,
    [activeHistoryItemId, historyItems],
  )

  const historyControl = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full px-3 text-xs text-slate-500 hover:text-slate-900"
        >
          <History size={14} />
          {tAgent('historyMenuLabel')}
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[320px] rounded-2xl p-2">
        <DropdownMenuLabel className="px-2 text-xs text-slate-500">
          {tAgent('historyMenuDescription')}
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="rounded-xl px-3 py-2.5"
          onClick={() => setActiveHistoryItemId(null)}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              <p className="truncate text-xs font-medium text-slate-900">
                {tAgent('historyMenuCurrentSession')}
              </p>
            </div>
            <p className="text-[11px] leading-5 text-slate-500">
              {tAgent('historyMenuCurrentSessionDescription')}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {historyItems.length === 0 ? (
          <div className="px-3 py-5 text-xs leading-6 text-slate-500">
            {tAgent('historyMenuEmpty')}
          </div>
        ) : (
          historyItems.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="items-start rounded-xl px-3 py-2.5"
              onClick={() => setActiveHistoryItemId(item.id)}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {item.status === 'completed' ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : item.status === 'failed' ? (
                    <XCircle size={14} className="text-amber-500" />
                  ) : (
                    <Sparkles size={14} className="text-indigo-500" />
                  )}
                  <p className="truncate text-xs font-medium text-slate-900">
                    {item.userMessage}
                  </p>
                </div>
                <p className="line-clamp-2 text-[11px] leading-5 text-slate-500">
                  {item.assistantSummary}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatHistoryTimestamp(item.createdAt)}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* 画布编辑器 (全屏幕尺寸) */}
      <div className="h-full">
        <ReactFlowProvider>
          <div className="relative h-full">
            <Canvas workflowId={id} canEdit={canEdit} />
            <AgentPanel
              header={(
                <AgentHeader
                  contextLabel={
                    activeHistoryItem
                      ? tAgent('historyViewingContext', {
                          time: formatHistoryTimestamp(activeHistoryItem.createdAt),
                        })
                      : undefined
                  }
                  historyControl={historyControl}
                  showIdentity={false}
                />
              )}
              conversation={(
                <AgentConversation
                  items={
                    activeHistoryItem
                      ? buildConversationItemsFromHistory(activeHistoryItem)
                      : conversationItems
                  }
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
                  title={
                    !activeHistoryItem && messages.length > 0
                      ? tAgent('quickActionsTitle')
                      : undefined
                  }
                  compact
                  actions={
                    activeHistoryItem
                      ? []
                      : pendingPlan
                      ? []
                      : messages.length === 0
                        ? heroActions
                        : quickActions
                  }
                  onSelect={(actionId) => {
                    const actionMap: Record<string, string> = {
                      'hero-workflow': tAgent('heroWorkflowCommandAsk'),
                      'hero-prompt': tAgent('heroPromptCommandAsk'),
                      'hero-chat': tAgent('heroChatModeAsk'),
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
                  disabled={isSubmitting || isApplying || Boolean(activeHistoryItem)}
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
                      : activeHistoryItem
                      ? tAgent('historyViewingHint')
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

function readAgentHistory(workflowId: string): AgentHistoryItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(AGENT_HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as AgentHistoryItem[]
    const now = Date.now()
    const filtered = parsed
      .filter((item) => now - new Date(item.createdAt).getTime() <= AGENT_HISTORY_MAX_AGE_MS)
      .filter((item) => item.workflowId === workflowId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return filtered
  } catch {
    return []
  }
}

function writeAgentHistory(nextItem: AgentHistoryItem): AgentHistoryItem[] {
  if (typeof window === 'undefined') {
    return [nextItem]
  }

  const existing = readAllAgentHistory()
  const deduped = existing.filter((item) => item.id !== nextItem.id)
  const nextItems = [nextItem, ...deduped]
    .filter((item) => Date.now() - new Date(item.createdAt).getTime() <= AGENT_HISTORY_MAX_AGE_MS)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const byWorkflow = new Map<string, AgentHistoryItem[]>()
  for (const item of nextItems) {
    const bucket = byWorkflow.get(item.workflowId) ?? []
    if (bucket.length < AGENT_HISTORY_MAX_ITEMS_PER_WORKFLOW) {
      bucket.push(item)
      byWorkflow.set(item.workflowId, bucket)
    }
  }

  const flattened = Array.from(byWorkflow.values()).flat()
  window.localStorage.setItem(AGENT_HISTORY_STORAGE_KEY, JSON.stringify(flattened))
  return flattened
}

function readAllAgentHistory(): AgentHistoryItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(AGENT_HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    return JSON.parse(raw) as AgentHistoryItem[]
  } catch {
    return []
  }
}

function buildAgentHistorySnapshot(input: {
  workflowId: string
  workflowName?: string
  messages: AgentMessage[]
  status: string
}): AgentHistoryItem | null {
  const meaningfulMessages = input.messages.filter(
    (message) => message.role === 'user' || message.role === 'assistant' || message.role === 'diagnosis',
  )

  const firstUserMessage = meaningfulMessages.find((message) => message.role === 'user')
  const latestAssistantLikeMessage = [...meaningfulMessages]
    .reverse()
    .find((message) => message.role === 'assistant' || message.role === 'diagnosis')

  if (!firstUserMessage || !latestAssistantLikeMessage) {
    return null
  }

  const status: AgentHistoryStatus =
    input.status === 'error'
      ? 'failed'
      : input.status === 'idle'
        ? 'completed'
        : 'in_progress'

  return {
    id: `${input.workflowId}:${firstUserMessage.createdAt}`,
    workflowId: input.workflowId,
    workflowName: input.workflowName,
    userMessage: firstUserMessage.text,
    assistantSummary: latestAssistantLikeMessage.text,
    status,
    createdAt: latestAssistantLikeMessage.createdAt,
  }
}

function buildConversationItemsFromHistory(item: AgentHistoryItem) {
  return [
    {
      id: `${item.id}:user`,
      type: 'message' as const,
      role: 'user' as const,
      text: item.userMessage,
      timestamp: formatHistoryTimestamp(item.createdAt),
    },
    {
      id: `${item.id}:assistant`,
      type: 'message' as const,
      role: item.status === 'failed' ? ('diagnosis' as const) : ('assistant' as const),
      text: item.assistantSummary,
      timestamp: formatHistoryTimestamp(item.createdAt),
    },
  ]
}

function formatHistoryTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

