/**
 * [INPUT]: 依赖 react 的 useState，依赖 @/lib/agent/* 计划链路与 @/stores/use-agent-store 的会话真相源
 * [OUTPUT]: 对外提供 useAgentSession()，把用户输入串成 summary -> plan API -> validation -> pendingPlan 的高层动作
 * [POS]: hooks 的 Agent 会话编排层，被编辑器页消费，不直接修改左侧画布
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { AGENT_ERROR_FALLBACK, AGENT_PROCESS_MESSAGES } from '@/lib/agent/constants'
import { buildAgentPlan } from '@/lib/agent/build-agent-plan'
import { summarizeCanvas } from '@/lib/agent/summarize-canvas'
import { validateAgentPlan } from '@/lib/agent/validate-agent-plan'
import { useAgentStore } from '@/stores/use-agent-store'

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
  const mode = useAgentStore((state) => state.mode)
  const appendMessage = useAgentStore((state) => state.appendMessage)
  const setStatus = useAgentStore((state) => state.setStatus)
  const setPendingPlan = useAgentStore((state) => state.setPendingPlan)
  const clearPendingPlan = useAgentStore((state) => state.clearPendingPlan)
  const setErrorMessage = useAgentStore((state) => state.setErrorMessage)

  const [isSubmitting, setIsSubmitting] = useState(false)

  async function sendMessage(rawValue: string) {
    const value = rawValue.trim()
    if (!value || isSubmitting) return

    setIsSubmitting(true)
    clearPendingPlan()
    setErrorMessage(null)

    appendMessage({
      id: crypto.randomUUID(),
      role: 'user',
      text: value,
      createdAt: new Date().toISOString(),
    })

    try {
      setStatus('understanding')
      appendProcessMessage(AGENT_PROCESS_MESSAGES.understanding)

      appendProcessMessage(AGENT_PROCESS_MESSAGES.summarizing)
      const canvasSummary = summarizeCanvas({
        workflowId,
        workflowName,
      })

      setStatus('planning')
      appendProcessMessage(AGENT_PROCESS_MESSAGES.planning)
      const plan = await buildAgentPlan({
        userMessage: value,
        mode,
        canvasSummary,
        locale,
      })

      appendProcessMessage(AGENT_PROCESS_MESSAGES.validating)
      const validation = validateAgentPlan(plan)

      if (!validation.ok) {
        throw new Error(validation.errors.join('；'))
      }

      const nextPlan = {
        ...plan,
        requiresConfirmation: plan.requiresConfirmation || validation.requiresConfirmation,
      }

      setPendingPlan(nextPlan)

      appendMessage({
        id: crypto.randomUUID(),
        role: 'proposal',
        planId: nextPlan.id,
        createdAt: new Date().toISOString(),
      })

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
      const message = error instanceof Error && error.message ? error.message : AGENT_ERROR_FALLBACK
      setPendingPlan(null)
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

  return {
    sendMessage,
    isSubmitting,
  }
}
