/**
 * [INPUT]: 依赖 zustand 的 create，依赖 @/types 的 TemplateSummary/WorkflowAuditEntry
 * [OUTPUT]: 对外提供 useWorkflowMetadataStore，维护当前画布的模板上下文与审计轨迹真相源
 * [POS]: stores 的工作流元数据状态层，被编辑器加载、自动保存与 Agent 模板改造链共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import type { TemplateSummary, WorkflowAuditEntry } from '@/types'

interface WorkflowMetadataState {
  template: TemplateSummary | null
  auditTrail: WorkflowAuditEntry[]
  setTemplate: (template: TemplateSummary | null) => void
  setAuditTrail: (auditTrail: WorkflowAuditEntry[]) => void
  appendAuditEntry: (entry: WorkflowAuditEntry) => void
  reset: () => void
}

export const useWorkflowMetadataStore = create<WorkflowMetadataState>((set) => ({
  template: null,
  auditTrail: [],
  setTemplate: (template) => set({ template }),
  setAuditTrail: (auditTrail) => set({ auditTrail }),
  appendAuditEntry: (entry) =>
    set((state) => ({
      auditTrail: [...state.auditTrail, entry],
    })),
  reset: () =>
    set({
      template: null,
      auditTrail: [],
    }),
}))
