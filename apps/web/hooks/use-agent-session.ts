/**
 * [INPUT]: 依赖 react 的 useState，依赖 @/lib/agent/* 的 plan/diagnose/explain/apply/prompt refine 链路，
 *          依赖 @/stores/use-agent-store 与 @/stores/use-flow-store 的会话/画布真相源
 * [OUTPUT]: 对外提供 useAgentSession()，把用户输入串成 summary -> plan|diagnose|explain -> workflow confirm -> prompt confirm -> apply -> run 的高层动作，并支持节点级局部执行
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
import type {
  AgentAssistantRuntime,
  AgentComposerAttachment,
  AgentMode,
  AgentPlan,
} from '@/lib/agent/types'
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

  async function runAssistantModel(
    assistantRuntime: AgentAssistantRuntime | undefined,
    prompt: string,
  ): Promise<string | null> {
    if (!assistantRuntime) {
      return null
    }

    const body =
      assistantRuntime.executionMode === 'platform'
        ? {
            executionMode: 'platform' as const,
            provider: assistantRuntime.provider,
            modelId: assistantRuntime.modelId,
            messages: [
              {
                role: 'system' as const,
                content:
                  '你是 Nano Banana Canvas 的 Agent 助手。请基于给定上下文输出简洁、专业、可执行的中文回答，不要虚构未提供的事实。',
              },
              {
                role: 'user' as const,
                content: prompt,
              },
            ],
            temperature: 0.4,
            maxTokens: 900,
            workflowId,
          }
        : {
            executionMode: 'user_key' as const,
            capability: 'text' as const,
            configId: assistantRuntime.configId,
            messages: [
              {
                role: 'system' as const,
                content:
                  '你是 Nano Banana Canvas 的 Agent 助手。请基于给定上下文输出简洁、专业、可执行的中文回答，不要虚构未提供的事实。',
              },
              {
                role: 'user' as const,
                content: prompt,
              },
            ],
            temperature: 0.4,
            maxTokens: 900,
            workflowId,
          }

    const response = await fetch('/api/ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null
      const detail = payload?.error?.message?.trim()
      throw new Error(
        detail ||
          (assistantRuntime.executionMode === 'platform'
            ? 'Agent 平台模型调用失败'
            : 'Agent 用户模型调用失败'),
      )
    }

    const payload = (await response.json()) as {
      ok?: boolean
      data?: { result?: string }
    }

    return payload.data?.result?.trim() || null
  }

  async function sendMessage(
    rawValue: string,
    assistantRuntime?: AgentAssistantRuntime,
    attachments: AgentComposerAttachment[] = [],
  ) {
    const value = rawValue.trim()
    if ((!value && attachments.length === 0) || isSubmitting) return

    if (value) {
      const handled = await tryHandleConversationalConfirmation(value)
      if (handled) {
        return
      }
    }

    setIsSubmitting(true)
    clearPendingPlan()
    clearPromptConfirmation()
    setErrorMessage(null)

    appendMessage({
      id: crypto.randomUUID(),
      role: 'user',
      text: value,
      attachments,
      createdAt: new Date().toISOString(),
    })

    try {
      setStatus('understanding')
      const createLikeMessage = requestKindMatchesCreateLikeMessage(value)
      if (!createLikeMessage) {
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.understanding))
      }

      const { template, auditTrail } = useWorkflowMetadataStore.getState()
      const canvasSummary = summarizeCanvas({
        workflowId,
        workflowName,
        template: template ?? undefined,
        auditTrail,
      })
      const preferLightweightCreationFlow =
        createLikeMessage &&
        (mode === 'create' || canvasSummary.nodeCount === 0)

      if (!preferLightweightCreationFlow && createLikeMessage) {
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.understanding))
      }

      if (!preferLightweightCreationFlow) {
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.summarizing))
      }
      void safeRecordAudit({
        eventType: 'message_sent',
        mode,
        userMessage: value,
        canvasSummary,
        targetNodeId: canvasSummary.selectionContext?.nodeId,
        metadata: {
          attachmentCount: attachments.length,
        },
      })

      const requestKind = resolveRequestKind(value, mode)

      if (requestKind === 'diagnose') {
        setStatus('diagnosing')
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.diagnosing))
        const diagnosis = await diagnoseCanvas({
          userMessage: value,
          canvasSummary,
          locale,
          assistantRuntime,
        })

        const diagnosisText = [
          diagnosis.summary,
          `现象：${diagnosis.phenomenon}`,
          `根因：${diagnosis.rootCause}`,
          `建议：${diagnosis.repairSuggestion}`,
        ].join('\n')
        const aiDiagnosisText =
          (await runAssistantModel(
            assistantRuntime,
            [
              '请把下面这份工作流诊断整理成对用户直接可读的中文回复。',
              '要求：',
              '1. 明确指出现象、根因、建议。',
              '2. 语气专业、简洁，不要重复标题。',
              '3. 如果有待确认风险，要提醒用户确认。',
              '',
              diagnosisText,
            ].join('\n'),
          )) ?? diagnosisText

        appendMessage({
          id: crypto.randomUUID(),
          role: 'diagnosis',
          text: aiDiagnosisText,
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
          setStatus(nextPlan.requiresConfirmation ? 'awaiting-workflow-confirmation' : 'patch-ready')
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
          assistantRuntime,
        })

        const optimizeText = [
          diagnosis.summary,
          `问题：${diagnosis.optimizationProposal?.issue ?? diagnosis.phenomenon}`,
          `原因：${diagnosis.optimizationProposal?.cause ?? diagnosis.rootCause}`,
          `提案：${diagnosis.optimizationProposal?.proposal ?? diagnosis.repairSuggestion}`,
          `风险：${diagnosis.optimizationProposal?.risk ?? diagnosis.riskSummary ?? '需要你确认后再动图。'}`,
        ].join('\n')
        const aiOptimizeText =
          (await runAssistantModel(
            assistantRuntime,
            [
              '请把下面这份工作流优化建议整理成对用户直接可读的中文回复。',
              '要求：',
              '1. 明确指出问题、原因、提案、风险。',
              '2. 保持简洁，但要让用户知道下一步怎么做。',
              '',
              optimizeText,
            ].join('\n'),
          )) ?? optimizeText

        appendMessage({
          id: crypto.randomUUID(),
          role: 'diagnosis',
          text: aiOptimizeText,
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
          setStatus(nextPlan.requiresConfirmation ? 'awaiting-workflow-confirmation' : 'patch-ready')
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
          assistantRuntime,
        })
        const aiAnswer =
          (await runAssistantModel(
            assistantRuntime,
            [
              '请基于下面这份工作流解释，用更自然、更面向用户的中文重新表述。',
              '要求：',
              '1. 不要改变事实。',
              '2. 优先解释当前主链或当前选中节点的职责。',
              '3. 结尾补一句下一步建议。',
              '',
              answer,
            ].join('\n'),
          )) ?? answer

        appendMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: aiAnswer,
          createdAt: new Date().toISOString(),
        })
        setStatus('idle')
        return
      }

      setStatus('planning')
      if (!preferLightweightCreationFlow) {
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.planning))
      }
      const planBuilder =
        requestKind === 'plan' && (mode === 'template' || canvasSummary.template)
          ? buildTemplatePlan
          : buildAgentPlan

      const planned = await planBuilder({
        userMessage: value,
        mode,
        canvasSummary,
        locale,
        assistantRuntime,
        attachments,
      })
      const plan = 'plan' in planned ? planned.plan : planned
      const alternatives = 'alternatives' in planned && planned.alternatives ? planned.alternatives : []

      if (!preferLightweightCreationFlow) {
        appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.validating))
      }
      const validation = validateAgentPlan(plan)

      if (!validation.ok) {
        throw new Error(validation.errors.join('；'))
      }

      const nextPlan = {
        ...plan,
        requiresConfirmation: plan.requiresConfirmation || validation.requiresConfirmation,
      }
      const aiPlanSummary = await runAssistantModel(
        assistantRuntime,
        [
          '请根据下面这份工作流计划，给用户写一段简洁中文说明。',
          '要求：',
          '1. 说明你准备怎么改。',
          '2. 点出为什么这样改。',
          '3. 如果需要用户确认，要明确说出来。',
          '4. 不要输出 JSON，不要编造不存在的操作。',
          '',
          `目标：${nextPlan.goal}`,
          `摘要：${nextPlan.summary}`,
          `原因：${nextPlan.reasons.join('；')}`,
          `需要确认：${nextPlan.requiresConfirmation ? '是' : '否'}`,
          `操作数：${nextPlan.operations.length}`,
        ].join('\n'),
      )

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

      const shouldAutoApply = shouldAutoApplyPlan(nextPlan, requestKind)

      if (nextPlan.templateContext) {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'template-context',
          text: `当前模板：${nextPlan.templateContext.sourceTemplate.name}；改造方向：${nextPlan.templateContext.adaptationDirection ?? '待进一步明确'}`,
          createdAt: new Date().toISOString(),
        })
      }

      if (aiPlanSummary) {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: aiPlanSummary,
          createdAt: new Date().toISOString(),
        })
      }

      if (!shouldAutoApply) {
        appendMessage({
          id: crypto.randomUUID(),
          role: 'proposal',
          planId: nextPlan.id,
          createdAt: new Date().toISOString(),
        })
      }

      if (!shouldAutoApply && alternatives.length > 0) {
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

      if (validation.warnings.length > 0) {
        appendProcessMessage(validation.warnings.join('；'))
      }

      if (shouldAutoApply) {
        if (!preferLightweightCreationFlow) {
          appendProcessMessage(tAgent('processBuildingWorkflow'))
        }
        await applyPendingPlan(nextPlan, {
          silentProgress: preferLightweightCreationFlow,
        })
        const latestPlan = useAgentStore.getState().pendingPlan
        if (latestPlan?.promptConfirmation) {
          appendMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            text: tAgent('messageWorkflowReadyForPrompt'),
            createdAt: new Date().toISOString(),
          })
          appendMessage({
            id: crypto.randomUUID(),
            role: 'prompt-confirmation',
            payloadId: latestPlan.promptConfirmation.id,
            payload: latestPlan.promptConfirmation,
            createdAt: new Date().toISOString(),
          })
          setStatus('awaiting-prompt-confirmation')
        }
        return
      }

      setStatus(nextPlan.requiresConfirmation ? 'awaiting-workflow-confirmation' : 'patch-ready')
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

  async function applyPendingPlan(
    planOverride = pendingPlan,
    options?: {
      silentProgress?: boolean
    },
  ) {
    if (!planOverride || isApplying) return

    setIsApplying(true)
    setErrorMessage(null)
    setStatus('applying-patch')
    if (!options?.silentProgress) {
      appendProcessMessage(tAgent(AGENT_PROCESS_MESSAGE_KEYS.applying))
    }

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

      const nextPromptPlan = resolvePromptTargetWithNodeMap(
        planOverride,
        result.nodeIdMap,
      )
      if (nextPromptPlan) {
        setPendingPlan(nextPromptPlan)
        setPromptConfirmation(nextPromptPlan.promptConfirmation ?? null)
        setStatus('awaiting-prompt-confirmation')
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
      if (!nextPromptPlan) {
        clearPendingPlan()
        clearPromptConfirmation()
        setStatus('idle')
      }
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
        attachedImageUrls: pendingPlan.promptConfirmation.attachedImageUrls,
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
      setStatus('awaiting-prompt-confirmation')
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
    const latestAgentState = useAgentStore.getState()
    const latestPendingPlan = latestAgentState.pendingPlan
    const latestPromptConfirmation = latestAgentState.promptConfirmation
    const planForConfirmation = latestPendingPlan?.promptConfirmation
      ? latestPendingPlan
      : buildFallbackPromptConfirmationPlan(latestPromptConfirmation)
    if (!planForConfirmation?.promptConfirmation) return
    if (payloadId && planForConfirmation.promptConfirmation.id !== payloadId) return

    const currentPlan = buildPromptConfirmedPlan(planForConfirmation)
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
    const existingTargetNodeId = resolvePromptTargetNodeId(payload.targetNodeId)
    const attachedImageUrl = payload.attachedImageUrls?.[0]

    // 已经落图过的创建提案，在确认阶段只做 prompt 回填与执行；
    // 不再重复重放 add/connect，避免生成第二套工作流。
    if (existingTargetNodeId) {
      const operations: AgentPlan['operations'] = [
        {
          type: 'update_node_data',
          nodeId: existingTargetNodeId,
          patch: {
            config: {
              text: executionPrompt,
            },
          },
        },
      ]

      const imageInputNodeId = attachedImageUrl
        ? findConnectedImageInputNodeId(existingTargetNodeId)
        : null

      if (imageInputNodeId && attachedImageUrl) {
        operations.push({
          type: 'update_node_data',
          nodeId: imageInputNodeId,
          patch: {
            config: {
              imageUrl: attachedImageUrl,
            },
          },
        })
      }

      operations.push({
        type: 'run_workflow',
        scope: 'from-node',
        nodeId: resolveExecutionStartNodeId(existingTargetNodeId),
      })

      return {
        ...plan,
        requiresConfirmation: false,
        operations,
        promptConfirmation: undefined,
      }
    }

    const appliedNodeIds = new Set(useFlowStore.getState().nodes.map((node) => node.id))
    let hasResolvedTarget = false

    const operations = plan.operations
      .filter((operation) => operation.type !== 'request_prompt_confirmation')
      .filter((operation) => {
        if (operation.type === 'add_node' && operation.nodeId && appliedNodeIds.has(operation.nodeId)) {
          return false
        }

        if (
          operation.type === 'connect' &&
          appliedNodeIds.has(operation.source) &&
          appliedNodeIds.has(operation.target)
        ) {
          return false
        }

        return true
      })
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

        if (
          attachedImageUrl &&
          operation.type === 'add_node' &&
          operation.nodeType === 'image-input'
        ) {
          return {
            ...operation,
            initialData: mergeNodeImageIntoInitialData(operation.initialData, attachedImageUrl),
          }
        }

        return operation
      })

    if (!hasResolvedTarget) {
      if (!existingTargetNodeId) return null

      operations.push({
        type: 'update_node_data',
        nodeId: existingTargetNodeId,
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
      nodeId: resolveExecutionStartNodeId(payload.targetNodeId),
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

function findConnectedImageInputNodeId(targetNodeId: string) {
  const { nodes, edges } = useFlowStore.getState()
  const targetNode = nodes.find((node) => node.id === targetNodeId)
  if (!targetNode) return null

  const generationNodeId =
    targetNode.type === 'image-gen'
      ? targetNode.id
      : edges.find(
          (edge) =>
            edge.source === targetNodeId &&
            normalizeHandleId(edge.targetHandle) === 'prompt-in',
        )?.target

  if (!generationNodeId) return null

  const incomingImageEdge = edges.find(
    (edge) =>
      edge.target === generationNodeId &&
      normalizeHandleId(edge.targetHandle) === 'image-in',
  )

  if (!incomingImageEdge) return null

  const sourceNode = nodes.find((node) => node.id === incomingImageEdge.source)
  if (!sourceNode || sourceNode.type !== 'image-input') {
    return null
  }

  return sourceNode.id
}

function resolveExecutionStartNodeId(targetNodeId: string) {
  const { nodes } = useFlowStore.getState()
  const targetNode = nodes.find((node) => node.id === targetNodeId)
  if (!targetNode) {
    return targetNodeId
  }

  return targetNodeId
}

  function selectPendingPlanVariant(planId: string) {
    const nextPlan = pendingPlanAlternatives.find((plan) => plan.id === planId)
    if (!nextPlan) return
    setPendingPlan(nextPlan)
    setPromptConfirmation(nextPlan.promptConfirmation ?? null)
    setStatus(nextPlan.requiresConfirmation ? 'awaiting-workflow-confirmation' : 'patch-ready')
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

  async function tryHandleConversationalConfirmation(value: string) {
    const latestAgentState = useAgentStore.getState()
    const latestPendingPlan = latestAgentState.pendingPlan
    const latestPromptConfirmation = latestAgentState.promptConfirmation
    const latestStatus = latestAgentState.status

    if (!latestPendingPlan && !latestPromptConfirmation) return false

    const normalized = normalizeConfirmationText(value)
    const isConfirmed = CONFIRMATION_PHRASES.has(normalized)
    const isRejected = REJECTION_PHRASES.has(normalized)

    if (!isConfirmed && !isRejected) return false

    appendMessage({
      id: crypto.randomUUID(),
      role: 'user',
      text: value,
      createdAt: new Date().toISOString(),
    })

    if (isRejected) {
      rejectPendingPlan()
      return true
    }

    if (latestStatus === 'awaiting-workflow-confirmation' && latestPendingPlan) {
      await applyPendingPlan(latestPendingPlan)
      return true
    }

    if (latestStatus === 'awaiting-prompt-confirmation' && latestPendingPlan?.promptConfirmation) {
      await confirmPromptAndRun(latestPendingPlan.promptConfirmation.id)
      return true
    }

    if (latestStatus === 'awaiting-prompt-confirmation' && latestPromptConfirmation) {
      await confirmPromptAndRun(
        latestPromptConfirmation.id,
      )
      return true
    }

    return true
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

function requestKindMatchesCreateLikeMessage(value: string) {
  return (
    value.includes('工作流') ||
    value.includes('图生图') ||
    value.includes('文生图') ||
    value.includes('搭建') ||
    value.includes('创建')
  )
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

const CONFIRMATION_PHRASES = new Set([
  '我确认',
  '我确定',
  '确认',
  '确定',
  '可以',
  '可以执行',
  '执行吧',
  '开始吧',
  '开始执行',
  '是的',
  '好的',
  '好',
  'ok',
  'okay',
  'yes',
  'yep',
  '继续',
  '继续吧',
])

const REJECTION_PHRASES = new Set([
  '不',
  '不用',
  '先不要',
  '取消',
  '算了',
  '先等等',
  '先别执行',
  '不要这样',
])

function normalizeConfirmationText(value: string) {
  return value.replace(/[。！!？，,\s]/g, '').trim().toLowerCase()
}

function shouldAutoApplyPlan(
  plan: AgentPlan,
  requestKind: 'plan' | 'diagnose' | 'explain' | 'optimize',
) {
  if (requestKind !== 'plan') return false
  if (plan.mode === 'create') return !plan.requiresConfirmation
  return !plan.requiresConfirmation && !plan.promptConfirmation
}

function buildFallbackPromptConfirmationPlan(
  payload: AgentPlan['promptConfirmation'] | null,
): AgentPlan | null {
  if (!payload) return null

  return {
    id: `plan_prompt_confirm_${payload.id}`,
    goal: payload.originalIntent,
    mode: 'create',
    intent: 'create_workflow',
    summary: '继续执行当前已确认的图片工作流。',
    reasons: ['当前确认卡片仍然存在，只缺少待执行计划外壳。'],
    requiresConfirmation: false,
    operations: [],
    promptConfirmation: payload,
  }
}

function mergeNodeImageIntoInitialData(
  initialData: Record<string, unknown> | undefined,
  imageUrl: string,
): Record<string, unknown> {
  const nextInitialData = isRecord(initialData) ? { ...initialData } : {}
  const currentConfig = isRecord(nextInitialData.config) ? nextInitialData.config : {}

  return {
    ...nextInitialData,
    config: {
      ...currentConfig,
      imageUrl,
    },
  }
}

function normalizeHandleId(handleId: string | null | undefined) {
  return handleId ?? null
}

function resolvePromptTargetWithNodeMap(
  plan: AgentPlan,
  nodeIdMap: Record<string, string>,
): AgentPlan | null {
  if (!plan.promptConfirmation?.targetNodeId) return null

  const mappedTargetNodeId =
    nodeIdMap[plan.promptConfirmation.targetNodeId] ?? plan.promptConfirmation.targetNodeId
  const nodes = useFlowStore.getState().nodes
  if (!nodes.some((node) => node.id === mappedTargetNodeId)) {
    return null
  }

  return {
    ...plan,
    promptConfirmation: {
      ...plan.promptConfirmation,
      targetNodeId: mappedTargetNodeId,
    },
  }
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
