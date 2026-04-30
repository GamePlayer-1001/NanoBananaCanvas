/**
 * [INPUT]: 依赖 zustand 的 create，依赖内建 Agent 类型定义与轻量状态机约束
 * [OUTPUT]: 对外提供 useAgentStore，以及 AgentMode / AgentSessionStatus / AgentMessage / AgentPlan 等基础类型
 * [POS]: stores 的 Agent 会话真相源，被 Agent 面板组件与后续 use-agent-session 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'

/* ─── Core Types ─────────────────────────────────────── */

export type AgentMode = 'create' | 'update' | 'diagnose' | 'optimize'

export type AgentSessionStatus =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'patch-ready'
  | 'awaiting-confirmation'
  | 'applying-patch'
  | 'ready-to-run'
  | 'running'
  | 'diagnosing'
  | 'error'

export interface AgentSelectionContext {
  nodeId?: string
  nodeType?: string
  nodeLabel?: string
}

export interface AgentPromptStyleOption {
  id: string
  label: string
  promptDelta: string
}

export interface PromptConfirmationPayload {
  id: string
  originalIntent: string
  visualProposal: string
  executionPrompt: string
  styleOptions?: AgentPromptStyleOption[]
}

export type WorkflowOperation =
  | {
      type: 'add_node'
      nodeType: string
      position?: { x: number; y: number }
      initialData?: Record<string, unknown>
    }
  | {
      type: 'update_node_data'
      nodeId: string
      patch: Record<string, unknown>
    }
  | {
      type: 'remove_node'
      nodeId: string
    }
  | {
      type: 'connect'
      source: string
      sourceHandle?: string
      target: string
      targetHandle?: string
    }
  | {
      type: 'disconnect'
      edgeId: string
    }
  | {
      type: 'focus_nodes'
      nodeIds: string[]
    }
  | {
      type: 'request_prompt_confirmation'
      payload: PromptConfirmationPayload
    }
  | {
      type: 'run_workflow'
      scope?: 'all' | 'from-node'
      nodeId?: string
    }

export interface AgentPlan {
  id: string
  goal: string
  mode: AgentMode
  summary: string
  reasons: string[]
  requiresConfirmation: boolean
  operations: WorkflowOperation[]
  promptConfirmation?: PromptConfirmationPayload
}

export type AgentMessage =
  | {
      id: string
      role: 'user'
      text: string
      createdAt: string
    }
  | {
      id: string
      role: 'assistant'
      text: string
      createdAt: string
    }
  | {
      id: string
      role: 'process'
      text: string
      step?: string
      createdAt: string
    }
  | {
      id: string
      role: 'proposal'
      planId: string
      createdAt: string
    }
  | {
      id: string
      role: 'prompt-confirmation'
      payloadId: string
      createdAt: string
    }
  | {
      id: string
      role: 'diagnosis'
      text: string
      severity: 'info' | 'warning' | 'error'
      createdAt: string
    }

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
