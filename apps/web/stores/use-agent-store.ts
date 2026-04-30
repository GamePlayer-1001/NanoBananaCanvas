/**
 * [INPUT]: 依赖 zustand 的 create，依赖 @/lib/agent/types 的 Agent 会话共享类型
 * [OUTPUT]: 对外提供 useAgentStore，以及 AgentMode / AgentSessionStatus / AgentMessage / AgentPlan 等类型重导出
 * [POS]: stores 的 Agent 会话真相源，被 Agent 面板组件与后续 use-agent-session 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import type {
  AgentMessage,
  AgentMode,
  AgentPlan,
  AgentSelectionContext,
  AgentSessionStatus,
  PromptConfirmationPayload,
} from '@/lib/agent/types'

export type {
  AgentMessage,
  AgentMode,
  AgentPlan,
  AgentPromptStyleOption,
  AgentSelectionContext,
  AgentSessionStatus,
  PromptConfirmationPayload,
  WorkflowOperation,
} from '@/lib/agent/types'

/* ─── Store Contract ─────────────────────────────────── */

interface AgentStoreState {
  mode: AgentMode
  status: AgentSessionStatus
  messages: AgentMessage[]
  pendingPlan: AgentPlan | null
  promptConfirmation: PromptConfirmationPayload | null
  selectionContext: AgentSelectionContext | null
  lastAppliedPlanId: string | null
  errorMessage: string | null

  appendMessage: (message: AgentMessage) => void
  setMode: (mode: AgentMode) => void
  setStatus: (status: AgentSessionStatus) => void
  setPendingPlan: (plan: AgentPlan | null) => void
  clearPendingPlan: () => void
  setPromptConfirmation: (payload: PromptConfirmationPayload | null) => void
  clearPromptConfirmation: () => void
  setSelectionContext: (context: AgentSelectionContext | null) => void
  setLastAppliedPlanId: (planId: string | null) => void
  setErrorMessage: (message: string | null) => void
  resetSession: () => void
}

const INITIAL_MODE: AgentMode = 'create'
const INITIAL_STATUS: AgentSessionStatus = 'idle'

export const useAgentStore = create<AgentStoreState>((set) => ({
  mode: INITIAL_MODE,
  status: INITIAL_STATUS,
  messages: [],
  pendingPlan: null,
  promptConfirmation: null,
  selectionContext: null,
  lastAppliedPlanId: null,
  errorMessage: null,

  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMode: (mode) => set({ mode }),

  setStatus: (status) => set({ status }),

  setPendingPlan: (plan) =>
    set({
      pendingPlan: plan,
      promptConfirmation: plan?.promptConfirmation ?? null,
    }),

  clearPendingPlan: () =>
    set({
      pendingPlan: null,
    }),

  setPromptConfirmation: (payload) => set({ promptConfirmation: payload }),

  clearPromptConfirmation: () => set({ promptConfirmation: null }),

  setSelectionContext: (context) => set({ selectionContext: context }),

  setLastAppliedPlanId: (planId) => set({ lastAppliedPlanId: planId }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  resetSession: () =>
    set({
      mode: INITIAL_MODE,
      status: INITIAL_STATUS,
      messages: [],
      pendingPlan: null,
      promptConfirmation: null,
      selectionContext: null,
      lastAppliedPlanId: null,
      errorMessage: null,
    }),
}))
