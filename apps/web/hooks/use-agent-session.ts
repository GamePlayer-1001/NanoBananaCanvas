/**
 * [INPUT]: 依赖 react 的 useState，依赖 @/lib/agent/* 的 plan/diagnose/explain/apply/prompt refine 链路，
 *          依赖 @/stores/use-agent-store 与 @/stores/use-flow-store 的会话/画布真相源
 * [OUTPUT]: 对外提供 useAgentSession()，把用户输入串成 summary -> plan|diagnose|explain -> prompt confirm -> apply -> run 的高层动作，并支持节点级局部执行
 * [POS]: hooks 的 Agent 会话编排层，被编辑器页消费，负责右侧提案、诊断与左侧落图之间的安全桥接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useWorkflowExecutor } from '@/hooks/use-workflow-executor'
import { recordAgentAudit } from '@/lib/agent/agent-audit'
import { applyAgentPlan } from '@/lib/agent/apply-agent-plan'
import {
  AGENT_ERROR_FALLBACK_KEY,
  AGENT_PROCESS_MESSAGE_KEYS,
} from '@/lib/agent/constants'
import { buildAgentPlan } from '@/lib/agent/build-agent-plan'
import { buildTemplatePlan } from '@/lib/agent/build-template-plan'
import { diagnoseCanvas } from '@/lib/agent/diagnose-canvas'
import { explainCanvas } from '@/lib/agent/explain-canvas'
import { optimizeCanvas } from '@/lib/agent/optimize-canvas'
import { refinePromptConfirmation } from '@/lib/agent/prompt-confirmation'
import { summarizeCanvas } from '@/lib/agent/summarize-canvas'
import { validateAgentPlan } from '@/lib/agent/validate-agent-plan'
import type { AgentMode, AgentPlan } from '@/lib/agent/types'
import { useAgentStore } from '@/stores/use-agent-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { useWorkflowMetadataStore } from '@/stores/use-workflow-metadata-store'

interface UseAgentSessionOptions {
  workflowId: string
  workflowName?: string
  locale: string
}

export function useAgentSession({
  workflowId,
  workflowName,
  locale,
}: UseAgentSessionOptions) {
  const tAgent = useTranslations('agentPanel')
  const { execute, executeFromNode } = useWorkflowExecutor(workflowId)
  const mode = useAgentStore((state) => state.mode)
  const pendingPlan = useAgentStore((state) => state.pendingPlan)
  const pendingPlanAlternatives = useAgentStore((state) => state.pendingPlanAlternatives)
  const appendMessage = useAgentStore((state) => state.appendMessage)
  const setStatus = useAgentStore((state) => state.setStatus)
  const setPendingPlan = useAgentStore((state) => state.setPendingPlan)
  const setPendingPlanAlternatives = useAgentStore((state) => state.setPendingPlanAlternatives)
  const clearPendingPlan = useAgentStore((state) => state.clearPendingPlan)
  const setErrorMessage = useAgentStore((state) => state.setErrorMessage)
  const setLastAppliedPlanId = useAgentStore((state) => state.setLastAppliedPlanId)
  const setPromptConfirmation = useAgentStore((state) => state.setPromptConfirmation)
  const clearPromptConfirmation = useAgentStore((state) => state.clearPromptConfirmation)
  const selectionContext = useAgentStore((state) => state.selectionContext)
  const rememberConversationTurn = useAgentStore((state) => state.rememberConversationTurn)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  async function sendMessage(rawValue: string) {
    const value = rawValue.trim()
    if (!value || isSubmitting) return

    setIsSubmitting(true)
    clearPendingPlan()
    clearPromptConfirmation()
    setErrorMessage(null)

    appendMessage({
      id: crypto.randomUUID(),
      role: 'user',
      text: value,
      createdAt: new Date().toISOString(),
    })

    try {
      setStatus('understanding')
      appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.understanding))

      appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.summarizing))
      const { template, auditTrail } = useWorkflowMetadataStore.getState()
      const canvasSummary = summarizeCanvas({
        workflowId,
        workflowName,
        template: template ?? undefined,
        auditTrail,
      })
      void safeRecordAudit({
        eventType: 'message_sent',
        mode,
        userMessage: value,
        canvasSummary,
        targetNodeId: canvasSummary.selectionContext?.nodeId,
      })

      const requestKind = resolveRequestKind(value, mode)

      if (requestKind === 'diagnose') {
        setStatus('diagnosing')
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.diagnosing))
        const diagnosis = await diagnoseCanvas({
          userMessage: value,
          canvasSummary,
          locale,
        })

        appendMessage({
          id: crypto.randomUUID(),
          role: 'diagnosis',
          text: [
            diagnosis.summary,
            `现象：${diagnosis.phenomenon}`,
            `根因：${diagnosis.rootCause}`,
            `建议：${diagnosis.repairSuggestion}`,
          ].join('\n'),
          severity: 'warning',
          createdAt: new Date().toISOString(),
        })

        if (diagnosis.suggestedOperations?.length) {
          const nextPlan: AgentPlan = {
            id: crypto.randomUUID(),
            goal: value,
            mode: 'diagnose',
            summary: diagnosis.summary,
            reasons: [diagnosis.rootCause, diagnosis.repairSuggestion],
            requiresConfirmation: diagnosis.requiresConfirmation,
            operations: diagnosis.suggestedOperations,
          }

          setPendingPlan(nextPlan)
          appendMessage({
            id: crypto.randomUUID(),
            role: 'proposal',
            planId: nextPlan.id,
            createdAt: new Date().toISOString(),
          })
          setStatus(nextPlan.requiresConfirmation ? 'awaiting-confirmation' : 'patch-ready')
        } else {
          setStatus('idle')
        }
        return
      }

      if (requestKind === 'optimize') {
        setStatus('optimizing')
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.diagnosing))
        const diagnosis = await optimizeCanvas({
          userMessage: value,
          canvasSummary,
          locale,
        })

        appendMessage({
          id: crypto.randomUUID(),
          role: 'diagnosis',
          text: [
            diagnosis.summary,
            `问题：${diagnosis.optimizationProposal?.issue ?? diagnosis.phenomenon}`,
            `原因：${diagnosis.optimizationProposal?.cause ?? diagnosis.rootCause}`,
            `提案：${diagnosis.optimizationProposal?.proposal ?? diagnosis.repairSuggestion}`,
            `风险：${diagnosis.optimizationProposal?.risk ?? diagnosis.riskSummary ?? '需要你确认后再动图。'}`,
          ].join('\n'),
          severity: 'warning',
          createdAt: new Date().toISOString(),
        })

        if (diagnosis.suggestedOperations?.length) {
          const nextPlan: AgentPlan = {
            id: crypto.randomUUID(),
            goal: value,
            mode: 'optimize',
            intent:
              diagnosis.dimension === 'speed'
                ? 'optimize_speed'
                : diagnosis.dimension === 'structure'
                  ? 'optimize_structure'
                  : 'optimize_cost',
            summary: diagnosis.summary,
            reasons: [
              diagnosis.optimizationProposal?.cause ?? diagnosis.rootCause,
              diagnosis.optimizationProposal?.risk ?? diagnosis.riskSummary ?? diagnosis.repairSuggestion,
            ],
            requiresConfirmation: diagnosis.requiresConfirmation,
            operations: diagnosis.suggestedOperations,
          }

          setPendingPlan(nextPlan)
          appendMessage({
            id: crypto.randomUUID(),
            role: 'proposal',
            planId: nextPlan.id,
            createdAt: new Date().toISOString(),
          })
          setStatus(nextPlan.requiresConfirmation ? 'awaiting-confirmation' : 'patch-ready')
        } else {
          setStatus('idle')
        }
        return
      }

      if (requestKind === 'explain') {
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.explaining))
        const answer = await explainCanvas({
          userMessage: value,
          canvasSummary,
          locale,
        })

        appendMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: answer,
          createdAt: new Date().toISOString(),
        })
        setStatus('idle')
        return
      }

      setStatus('planning')
      appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.planning))
      const planBuilder =
        requestKind === 'plan' && (mode === 'template' || canvasSummary.template)
          ? buildTemplatePlan
          : buildAgentPlan

      const planned = await planBuilder({
        userMessage: value,
        mode,
        canvasSummary,
        locale,
      })
      const plan = 'plan' in planned ? planned.plan : planned
      const alternatives = 'alternatives' in planned && planned.alternatives ? planned.alternatives : []

      appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.validating))
      const validation = validateAgentPlan(plan)

      if (!validation.ok) {
        throw new Error(validation.errors.join('；'))
      }

      const nextPlan = {
        ...plan,
        requiresConfirmation: plan.requiresConfirmation || validation.requiresConfirmation,
      }

      setPendingPlan(nextPlan)
      setPendingPlanAlternatives([nextPlan, ...alternatives])
      rememberConversationTurn({
        id: crypto.randomUUID(),
        userMessage: value,
        summary: nextPlan.summary,
        selectedNodeId: selectionContext?.nodeId,
        selectedNodeLabel: selectionContext?.nodeLabel,
        createdAt: new Date().toISOString(),
      })
      void safeRecordAudit({
        eventType: 'plan_generated',
        mode: nextPlan.mode,
        userMessage: value,
        canvasSummary,
        plan: nextPlan,
        alternatives,
        proposalId: nextPlan.id,
        targetNodeId: canvasSummary.selectionContext?.nodeId,
        metadata: {
          alternativeCount: alternatives.length,
        },
      })

      if (nextPlan.templateContext) {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'template-context',
          text: `当前模板：${nextPlan.templateContext.sourceTemplate.name}；改造方向：${nextPlan.templateContext.adaptationDirection ?? '待进一步明确'}`,
          createdAt: new Date().toISOString(),
        })
      }

      appendMessage({
        id: crypto.randomUUID(),
        role: 'proposal',
        planId: nextPlan.id,
        createdAt: new Date().toISOString(),
      })

      if (alternatives.length > 0) {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'proposal-comparison',
          proposalIds: [nextPlan.id, ...alternatives.map((item) => item.id)],
          createdAt: new Date().toISOString(),
        })
        void safeRecordAudit({
          eventType: 'plan_compared',
          mode: nextPlan.mode,
          userMessage: value,
          plan: nextPlan,
          alternatives,
          proposalId: nextPlan.id,
          metadata: {
            proposalIds: [nextPlan.id, ...alternatives.map((item) => item.id)],
          },
        })
      }

      if (nextPlan.promptConfirmation) {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'prompt-confirmation',
          payloadId: nextPlan.promptConfirmation.id,
          createdAt: new Date().toISOString(),
        })
      }

      if (validation.warnings.length > 0) {
        appendProcessMessage(validation.warnings.join('；'))
      }

      setStatus(nextPlan.requiresConfirmation ? 'awaiting-confirmation' : 'patch-ready')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : tAgent(AGENT_ERROR_FALLBACK_KEY)
      setPendingPlan(null)
      setPendingPlanAlternatives([])
      setStatus('error')
      setErrorMessage(message)
      appendMessage({
        id: crypto.randomUUID(),
        role: 'diagnosis',
        text: message,
        severity: 'error',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function appendProcessMessage(text: string) {
    appendMessage({
      id: crypto.randomUUID(),
      role: 'process',
      text,
      createdAt: new Date().toISOString(),
    })
  }

  async function applyPendingPlan(planOverride = pendingPlan) {
    if (!planOverride || isApplying) return

    setIsApplying(true)
    setErrorMessage(null)
    setStatus('applying-patch')
    appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.applying))

    try {
      const result = await applyAgentPlan(planOverride, {
        workflowId,
        runWorkflow: async (scope, nodeId) => {
          if (scope === 'all') {
            await execute()
            return
          }

          if (scope === 'from-node' && nodeId) {
            await executeFromNode(nodeId)
          }
        },
      })

      if (!result.ok) {
        throw new Error(
          result.rolledBack
            ? `${result.summary} 已回滚到修改前状态。`
            : result.summary,
        )
      }

      appendMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.summary,
        createdAt: new Date().toISOString(),
      })
      void safeRecordAudit({
        eventType: 'plan_applied',
        mode: planOverride.mode,
        plan: planOverride,
        proposalId: planOverride.id,
        confirmed: true,
        result: {
          ok: result.ok,
          summary: result.summary,
          rolledBack: result.rolledBack,
        },
        replaySnapshot: {
          focusNodeIds: extractFocusNodeIds(planOverride),
          changeSummary: result.summary,
          planId: planOverride.id,
        },
      })

      setLastAppliedPlanId(planOverride.id)
      setErrorMessage(null)
      clearPendingPlan()
      clearPromptConfirmation()
      setStatus('idle')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : tAgent(AGENT_ERROR_FALLBACK_KEY)
      setStatus('error')
      setErrorMessage(message)
      appendMessage({
        id: crypto.randomUUID(),
        role: 'diagnosis',
        text: message,
        severity: 'error',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setIsApplying(false)
    }
  }

  function rejectPendingPlan() {
    if (!pendingPlan) return

    appendMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      text: tAgent('messageRejected'),
      createdAt: new Date().toISOString(),
    })
    clearPendingPlan()
    clearPromptConfirmation()
    setStatus('idle')
  }

  async function regeneratePrompt(payloadId?: string, styleDirection?: string) {
    if (!pendingPlan?.promptConfirmation) return
    if (payloadId && pendingPlan.promptConfirmation.id !== payloadId) return

    setIsApplying(true)
    appendProcessMessage(
      styleDirection
        ? tAgent(AGENT_PROCESS_MESSAGE_KEYS.regenerateStyle, { style: styleDirection })
        : tAgent(AGENT_PROCESS_MESSAGE_KEYS.regenerateDefault),
    )

    try {
      const payload = await refinePromptConfirmation({
        originalIntent: pendingPlan.promptConfirmation.originalIntent,
        executionPrompt: pendingPlan.promptConfirmation.executionPrompt,
        styleDirection,
        regenerate: true,
      })

      const nextPayload = {
        ...payload,
        targetNodeId: pendingPlan.promptConfirmation.targetNodeId,
      }

      setPromptConfirmation(nextPayload)
      setPendingPlan({
        ...pendingPlan,
        promptConfirmation: nextPayload,
      })
      setStatus('awaiting-confirmation')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : tAgent(AGENT_ERROR_FALLBACK_KEY)
      setStatus('error')
      setErrorMessage(message)
      appendMessage({
        id: crypto.randomUUID(),
        role: 'diagnosis',
        text: message,
        severity: 'error',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setIsApplying(false)
    }
  }

  async function confirmPromptAndRun(payloadId?: string) {
    if (!pendingPlan?.promptConfirmation) return
    if (payloadId && pendingPlan.promptConfirmation.id !== payloadId) return

    const currentPlan = buildPromptConfirmedPlan(pendingPlan)
    if (!currentPlan) {
      const message = tAgent('errorMissingPromptTarget')
      setStatus('error')
      setErrorMessage(message)
      appendMessage({
        id: crypto.randomUUID(),
        role: 'diagnosis',
        text: message,
        severity: 'error',
        createdAt: new Date().toISOString(),
      })
      return
    }

    setPendingPlan(currentPlan)
    setPromptConfirmation(null)
    appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.promptConfirmed))
    void safeRecordAudit({
      eventType: 'prompt_confirmed',
      mode: currentPlan.mode,
      plan: currentPlan,
      proposalId: currentPlan.id,
      confirmed: true,
      targetNodeId: currentPlan.promptConfirmation?.targetNodeId,
    })
    await applyPendingPlan(currentPlan)
  }

  function buildPromptConfirmedPlan(plan: AgentPlan): AgentPlan | null {
    const payload = plan.promptConfirmation
    if (!payload?.targetNodeId) return null

    const executionPrompt = payload.executionPrompt
    let hasResolvedTarget = false

    const operations = plan.operations
      .filter((operation) => operation.type !== 'request_prompt_confirmation')
      .map((operation) => {
        if (
          operation.type === 'add_node' &&
          operation.nodeId === payload.targetNodeId
        ) {
          hasResolvedTarget = true
          return {
            ...operation,
            initialData: mergeNodeTextIntoInitialData(operation.initialData, executionPrompt),
          }
        }

        return operation
      })

    if (!hasResolvedTarget) {
      const targetNodeId = resolvePromptTargetNodeId(payload.targetNodeId)
      if (!targetNodeId) return null

      operations.push({
        type: 'update_node_data',
        nodeId: targetNodeId,
        patch: {
          config: {
            text: executionPrompt,
          },
        },
      })
    }

    operations.push({
      type: 'run_workflow',
      scope: 'from-node',
      nodeId: payload.targetNodeId,
    })

    return {
      ...plan,
      requiresConfirmation: false,
      operations,
      promptConfirmation: undefined,
    }
  }

  function resolvePromptTargetNodeId(nodeId?: string) {
    if (!nodeId) return null

    const currentNodes = useFlowStore.getState().nodes
    if (currentNodes.some((node) => node.id === nodeId)) {
      return nodeId
    }

    return null
  }

  function selectPendingPlanVariant(planId: string) {
    const nextPlan = pendingPlanAlternatives.find((plan) => plan.id === planId)
    if (!nextPlan) return
    setPendingPlan(nextPlan)
    setPromptConfirmation(nextPlan.promptConfirmation ?? null)
    setStatus(nextPlan.requiresConfirmation ? 'awaiting-confirmation' : 'patch-ready')
    void safeRecordAudit({
      eventType: 'plan_selected',
      mode: nextPlan.mode,
      plan: nextPlan,
      proposalId: nextPlan.id,
      metadata: {
        selectedVariant: nextPlan.variantLabel ?? nextPlan.id,
      },
    })
  }

  function safeRecordAudit(
    payload: Omit<Parameters<typeof recordAgentAudit>[1], 'metadata'> & {
      metadata?: Record<string, unknown>
    },
  ) {
    void recordAgentAudit(workflowId, payload).catch(() => {
      // 审计失败不阻塞主链
    })
  }

  return {
    sendMessage,
    isSubmitting,
    applyPendingPlan,
    pendingPlanAlternatives,
    selectPendingPlanVariant,
    rejectPendingPlan,
    isApplying,
    regeneratePrompt,
    confirmPromptAndRun,
  }

}

function extractFocusNodeIds(plan: AgentPlan) {
  return plan.operations
    .filter((operation): operation is Extract<typeof plan.operations[number], { type: 'focus_nodes' }> =>
      operation.type === 'focus_nodes',
    )
    .flatMap((operation) => operation.nodeIds)
}

function mergeNodeTextIntoInitialData(
  initialData: Record<string, unknown> | undefined,
  text: string,
): Record<string, unknown> {
  const nextInitialData = isRecord(initialData) ? { ...initialData } : {}
  const currentConfig = isRecord(nextInitialData.config) ? nextInitialData.config : {}

  return {
    ...nextInitialData,
    config: {
      ...currentConfig,
      text,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveRequestKind(
  userMessage: string,
  mode: AgentMode,
): 'plan' | 'diagnose' | 'explain' | 'optimize' {
  const normalized = userMessage.trim().toLowerCase()

  if (mode === 'diagnose') {
    return 'diagnose'
  }

  if (mode === 'optimize') {
    return 'optimize'
  }

  if (
    normalized.includes('为什么') ||
    normalized.includes('报错') ||
    normalized.includes('跑不通') ||
    normalized.includes('失败') ||
    normalized.includes('诊断')
  ) {
    return 'diagnose'
  }

  if (
    normalized.includes('优化') ||
    normalized.includes('省钱') ||
    normalized.includes('成本') ||
    normalized.includes('更快') ||
    normalized.includes('太慢')
  ) {
    return 'optimize'
  }

  if (
    normalized.includes('解释') ||
    normalized.includes('这条链在做什么') ||
    normalized.includes('这个节点在做什么') ||
    normalized.includes('workflow 在做什么')
  ) {
    return 'explain'
  }

  return 'plan'
}
