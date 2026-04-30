/**
 * [INPUT]: 依赖 vitest，依赖 use-agent-store
 * [OUTPUT]: 对外提供 useAgentStore 的单元测试，覆盖会话状态初始化、消息追加、计划联动与重置
 * [POS]: stores 的 Agent 会话回归测试，确保右侧面板不会因状态机回归而失真
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { useAgentStore } from './use-agent-store'

const initialState = {
  mode: 'create' as const,
  status: 'idle' as const,
  messages: [],
  pendingPlan: null,
  pendingPlanAlternatives: [],
  promptConfirmation: null,
  selectionContext: null,
  conversationMemory: [],
  lastAppliedPlanId: null,
  errorMessage: null,
}

function createPromptPayload() {
  return {
    id: 'prompt-1',
    originalIntent: '生成一张海报',
    visualProposal: '一张商业感较强的产品海报',
    executionPrompt: 'Create a commercial product poster.',
    styleOptions: [
      {
        id: 'realistic',
        label: '更写实',
        promptDelta: '强调真实摄影与光影',
      },
    ],
  }
}

function createPlan() {
  return {
    id: 'plan-1',
    goal: '创建海报工作流',
    mode: 'create' as const,
    summary: '新增基础图片工作流',
    reasons: ['当前画布为空'],
    requiresConfirmation: true,
    operations: [],
    promptConfirmation: createPromptPayload(),
  }
}

describe('useAgentStore', () => {
  beforeEach(() => {
    useAgentStore.setState(initialState)
  })

  it('starts from the expected default session state', () => {
    expect(useAgentStore.getState()).toMatchObject(initialState)
  })

  it('appends messages in order and updates simple view state fields', () => {
    const firstMessage = {
      id: 'msg-1',
      role: 'user' as const,
      text: '帮我生成工作流',
      createdAt: '2026-04-30T00:00:00.000Z',
    }
    const secondMessage = {
      id: 'msg-2',
      role: 'process' as const,
      text: '我先理解一下你的目标。',
      createdAt: '2026-04-30T00:00:01.000Z',
    }

    useAgentStore.getState().appendMessage(firstMessage)
    useAgentStore.getState().appendMessage(secondMessage)
    useAgentStore.getState().setMode('diagnose')
    useAgentStore.getState().setStatus('planning')
    useAgentStore.getState().setSelectionContext({
      nodeId: 'image-1',
      nodeType: 'image-gen',
      nodeLabel: '图片生成',
    })
    useAgentStore.getState().setLastAppliedPlanId('plan-1')
    useAgentStore.getState().setErrorMessage('出错了')

    const state = useAgentStore.getState()

    expect(state.messages).toEqual([firstMessage, secondMessage])
    expect(state.mode).toBe('diagnose')
    expect(state.status).toBe('planning')
    expect(state.selectionContext).toEqual({
      nodeId: 'image-1',
      nodeType: 'image-gen',
      nodeLabel: '图片生成',
    })
    expect(state.lastAppliedPlanId).toBe('plan-1')
    expect(state.errorMessage).toBe('出错了')
  })

  it('keeps pending plan and prompt confirmation in sync', () => {
    const plan = createPlan()
    const alternative = {
      ...plan,
      id: 'plan-2',
      summary: '更保守的海报工作流',
    }

    useAgentStore.getState().setPendingPlan(plan)
    useAgentStore.getState().setPendingPlanAlternatives([plan, alternative])

    expect(useAgentStore.getState().pendingPlan).toEqual(plan)
    expect(useAgentStore.getState().pendingPlanAlternatives).toEqual([plan, alternative])
    expect(useAgentStore.getState().promptConfirmation).toEqual(plan.promptConfirmation)

    useAgentStore.getState().clearPendingPlan()
    expect(useAgentStore.getState().pendingPlan).toBeNull()
    expect(useAgentStore.getState().pendingPlanAlternatives).toEqual([])
    expect(useAgentStore.getState().promptConfirmation).toEqual(plan.promptConfirmation)

    useAgentStore.getState().clearPromptConfirmation()
    expect(useAgentStore.getState().promptConfirmation).toBeNull()
  })

  it('supports manual prompt confirmation updates and full session reset', () => {
    const payload = createPromptPayload()
    const message = {
      id: 'msg-1',
      role: 'assistant' as const,
      text: '我给你准备了一版提示词。',
      createdAt: '2026-04-30T00:00:00.000Z',
    }

    useAgentStore.getState().appendMessage(message)
    useAgentStore.getState().setMode('optimize')
    useAgentStore.getState().setStatus('awaiting-confirmation')
    useAgentStore.getState().setPromptConfirmation(payload)
    useAgentStore.getState().setSelectionContext({
      nodeId: 'text-1',
      nodeType: 'text-input',
      nodeLabel: '文本输入',
    })
    useAgentStore.getState().rememberConversationTurn({
      id: 'memory-1',
      userMessage: '给我一版更商业化的方向',
      summary: '用户希望当前工作流往更商业化的输出方向继续收敛。',
      selectedNodeId: 'text-1',
      selectedNodeLabel: '文本输入',
      createdAt: '2026-04-30T00:00:02.000Z',
    })
    useAgentStore.getState().setLastAppliedPlanId('plan-2')
    useAgentStore.getState().setErrorMessage('temporary error')

    expect(useAgentStore.getState().promptConfirmation).toEqual(payload)
    expect(useAgentStore.getState().conversationMemory).toHaveLength(1)

    useAgentStore.getState().resetSession()

    expect(useAgentStore.getState()).toMatchObject(initialState)
  })
})
