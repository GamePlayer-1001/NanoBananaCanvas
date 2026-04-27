/**
 * [INPUT]: 依赖 @/stores/use-flow-store 的节点/边/视口状态，
 *          依赖 @/services/storage/local-storage 的持久化能力，
 *          依赖 @/services/storage/serializer 的序列化能力，
 *          依赖 zustand 的 create (保存状态原子)
 * [OUTPUT]: 对外提供 useAutoSave hook (防抖自动保存: localStorage + 云端)，
 *           对外提供 useCloudSaveStatus 状态原子，
 *           对外提供 triggerCloudSave 显式云保存方法
 * [POS]: hooks 的持久化桥梁，在画布页面挂载时激活
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
import { useFlowStore } from '@/stores/use-flow-store'
import { loadFromLocal, saveToLocal } from '@/services/storage/local-storage'
import { serializeWorkflow } from '@/services/storage/serializer'

/* ─── Cloud Save Status Atom ──────────────────────────── */

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export const useCloudSaveStatus = create<{ status: SaveStatus }>(() => ({
  status: 'idle',
}))

/* ─── Constants ───────────────────────────────────────── */

const DEBOUNCE_LOCAL_MS = 1000
const DEBOUNCE_CLOUD_MS = 2000

/* ─── Cloud Save ──────────────────────────────────────── */

function getSerializedWorkflowSnapshot() {
  const { nodes, edges, viewport } = useFlowStore.getState()
  return {
    nodes,
    edges,
    viewport,
    serialized: serializeWorkflow(nodes, edges, viewport),
  }
}

export async function triggerCloudSave(workflowId: string): Promise<void> {
  const snapshot = getSerializedWorkflowSnapshot()
  saveToLocal(snapshot.nodes, snapshot.edges, snapshot.viewport)
  useCloudSaveStatus.setState({ status: 'saving' })

  try {
    const res = await fetch(`/api/workflows/${workflowId}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: JSON.stringify(snapshot.serialized) }),
    })
    if (!res.ok) throw new Error(`Save failed: ${res.status}`)
    useCloudSaveStatus.setState({ status: 'saved' })
  } catch (error) {
    useCloudSaveStatus.setState({ status: 'error' })
    throw error
  }
}

/* ─── Hook ────────────────────────────────────────────── */

export function useAutoSave(workflowId?: string, enableCloud = true) {
  const hasLoaded = useRef(false)

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
    let cloudTimer: ReturnType<typeof setTimeout> | null = null

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
      localTimer = setTimeout(() => {
        saveToLocal(state.nodes, state.edges, state.viewport)
      }, DEBOUNCE_LOCAL_MS)

      /* 云端保存 (2s 防抖，仅 workflowId 存在时) */
      if (workflowId && enableCloud) {
        if (cloudTimer) clearTimeout(cloudTimer)
        cloudTimer = setTimeout(() => {
          void triggerCloudSave(workflowId)
        }, DEBOUNCE_CLOUD_MS)
      }
    })

    return () => {
      unsubscribe()
      if (localTimer) clearTimeout(localTimer)
      if (cloudTimer) clearTimeout(cloudTimer)
    }
  }, [workflowId, enableCloud])
}
