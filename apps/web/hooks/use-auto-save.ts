/**
 * [INPUT]: 依赖 @/stores/use-flow-store 的节点/边/视口状态，
 *          依赖 @/services/storage/local-storage 的持久化能力，
 *          依赖 @/services/storage/serializer 的序列化能力，
 *          依赖 zustand 的 create (保存状态原子)
 * [OUTPUT]: 对外提供 useAutoSave hook (防抖自动保存: localStorage + 离场兜底云保存)，
 *           对外提供 useCloudSaveStatus 状态原子，
 *           对外提供 triggerCloudSave / primeCloudSaveBaseline / markCloudSaveError 等保存控制方法
 * [POS]: hooks 的持久化桥梁，在画布页面挂载时激活，负责本地草稿持久化、未保存标记与离场补写
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * [CONFLICT STRATEGY]: Last-Write-Wins (LWW)
 *   当前为单用户编辑场景，云端 PUT 直接覆盖，无版本检测。
 *   如果未来引入多用户协作 (P3 COLLAB)，需升级为:
 *   - 乐观锁: PUT 携带 updated_at，服务端 WHERE updated_at = ? 校验
 *   - 或 CRDT/OT 方案 (Durable Objects)
 *   当前设计的合理性: 工作流仅归属 owner，不存在并发写入场景。
 */

'use client'

import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useWorkflowMetadataStore } from '@/stores/use-workflow-metadata-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { loadFromLocal, saveToLocal } from '@/services/storage/local-storage'
import { serializeWorkflow } from '@/services/storage/serializer'

/* ─── Cloud Save Status Atom ──────────────────────────── */

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved'

type CloudSaveState = {
  status: SaveStatus
  hasUnsavedChanges: boolean
  lastPersistedSnapshot: string
}

export const useCloudSaveStatus = create<CloudSaveState>(() => ({
  status: 'idle',
  hasUnsavedChanges: false,
  lastPersistedSnapshot: '',
}))

/* ─── Constants ───────────────────────────────────────── */

const DEBOUNCE_LOCAL_MS = 400

function getStableSerializedJson(serialized: ReturnType<typeof serializeWorkflow>) {
  return JSON.stringify(serialized, (key, value) => (key === 'savedAt' ? undefined : value))
}

function setCloudSaveSaved(stableSerializedJson: string) {
  useCloudSaveStatus.setState({
    status: 'saved',
    hasUnsavedChanges: false,
    lastPersistedSnapshot: stableSerializedJson,
  })
}

function setCloudSaveUnsaved() {
  useCloudSaveStatus.setState((state) => ({
    ...state,
    status: 'unsaved',
    hasUnsavedChanges: true,
  }))
}

export function markCloudSaveError() {
  useCloudSaveStatus.setState((state) => ({
    ...state,
    status: 'error',
  }))
}

export function primeCloudSaveBaseline(stableSerializedJson?: string) {
  const snapshot =
    stableSerializedJson ?? getSerializedWorkflowSnapshot().stableSerializedJson
  setCloudSaveSaved(snapshot)
}

/* ─── Cloud Save ──────────────────────────────────────── */

function getSerializedWorkflowSnapshot() {
  const { nodes, edges, viewport } = useFlowStore.getState()
  const { template, auditTrail } = useWorkflowMetadataStore.getState()
  const serialized = serializeWorkflow(nodes, edges, viewport, 'Untitled Workflow', {
    template: template ?? undefined,
    auditTrail,
  })
  const stableSerializedJson = getStableSerializedJson(serialized)
  return {
    nodes,
    edges,
    viewport,
    serialized,
    serializedJson: JSON.stringify(serialized),
    stableSerializedJson,
  }
}

export async function triggerCloudSave(
  workflowId: string,
  options?: { keepalive?: boolean; onSaved?: (serializedJson: string) => void },
): Promise<void> {
  const snapshot = getSerializedWorkflowSnapshot()
  saveToLocal(snapshot.nodes, snapshot.edges, snapshot.viewport)
  useCloudSaveStatus.setState((state) => ({
    ...state,
    status: 'saving',
  }))

  try {
    const res = await fetch(`/api/workflows/${workflowId}`, {
      method: 'PUT',
      keepalive: options?.keepalive,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: JSON.stringify(snapshot.serialized) }),
    })
    if (!res.ok) throw new Error(`Save failed: ${res.status}`)
    options?.onSaved?.(snapshot.serializedJson)
    setCloudSaveSaved(snapshot.stableSerializedJson)
  } catch (error) {
    markCloudSaveError()
    throw error
  }
}

/* ─── Hook ────────────────────────────────────────────── */

export function useAutoSave(workflowId?: string, enableCloud = true) {
  const hasLoaded = useRef(false)
  const lastChangeAtRef = useRef(0)

  /* ── 页面加载时恢复 (仅无 workflowId 时从 localStorage) ── */
  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true

    // 有 workflowId 时，由 EditorPage 负责从 API 加载
    if (workflowId) return

    const saved = loadFromLocal()
    if (saved && saved.nodes.length > 0) {
      useFlowStore.getState().setFlow(saved.nodes, saved.edges, saved.viewport)
    }
  }, [workflowId])

  /* ── 防抖自动保存 (subscribe 模式) ─────────────────── */
  useEffect(() => {
    let localTimer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = useFlowStore.subscribe((state, prev) => {
      if (
        state.nodes === prev.nodes &&
        state.edges === prev.edges &&
        state.viewport === prev.viewport
      ) {
        return
      }

      /* localStorage 保存 (1s 防抖，始终执行) */
      if (localTimer) clearTimeout(localTimer)
      lastChangeAtRef.current = Date.now()
      localTimer = setTimeout(() => {
        saveToLocal(state.nodes, state.edges, state.viewport)
      }, DEBOUNCE_LOCAL_MS)

      /* 云端不再常驻自动保存，只在本地标脏 */
      if (workflowId && enableCloud) {
        const snapshot = getSerializedWorkflowSnapshot()
        const { lastPersistedSnapshot } = useCloudSaveStatus.getState()
        if (snapshot.stableSerializedJson !== lastPersistedSnapshot) {
          setCloudSaveUnsaved()
        } else {
          setCloudSaveSaved(lastPersistedSnapshot)
        }
      }
    })

    const flushPendingSave = () => {
      if (!workflowId || !enableCloud) return
      const { hasUnsavedChanges, lastPersistedSnapshot } = useCloudSaveStatus.getState()
      if (!hasUnsavedChanges) return

      if (localTimer) {
        clearTimeout(localTimer)
        localTimer = null
      }

      const snapshot = getSerializedWorkflowSnapshot()
      if (snapshot.stableSerializedJson === lastPersistedSnapshot) return
      saveToLocal(snapshot.nodes, snapshot.edges, snapshot.viewport)
      void triggerCloudSave(workflowId, {
        keepalive: true,
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave()
      }
    }

    window.addEventListener('pagehide', flushPendingSave)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      flushPendingSave()
      unsubscribe()
      if (localTimer) clearTimeout(localTimer)
      window.removeEventListener('pagehide', flushPendingSave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [workflowId, enableCloud])
}
