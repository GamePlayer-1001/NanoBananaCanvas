/**
 * [INPUT]: 依赖 @/components/nodes/plugin-registry 的 getNodePorts，依赖 @/types 的 PortDefinition
 * [OUTPUT]: 对外提供 resolveAutoConnectTargetHandle() 自动推断拖线创建节点时的目标输入端口
 * [POS]: lib/utils 的自动连线推断工具，被 Canvas 在“拖线到空白处创建节点”场景消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getNodePorts } from '@/components/nodes/plugin-registry'
import type { PortDefinition } from '@/types'

/* ─── Helpers ─────────────────────────────────────────── */

function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === 'any' || targetType === 'any') return true
  return sourceType === targetType
}

function normalizeSemanticName(handleId: string): string {
  return handleId.replace(/-(in|out)$/, '')
}

function scoreCandidate(
  sourceHandleId: string,
  candidate: PortDefinition,
  compatibleCount: number,
): number {
  let score = 0

  if (normalizeSemanticName(candidate.id) === normalizeSemanticName(sourceHandleId)) {
    score += 4
  }

  if (candidate.required) {
    score += 2
  }

  if (compatibleCount === 1) {
    score += 1
  }

  return score
}

/* ─── Public ──────────────────────────────────────────── */

export function resolveAutoConnectTargetHandle(
  sourceNodeType: string,
  sourceHandleId: string | null | undefined,
  targetNodeType: string,
): string | null {
  if (!sourceHandleId) return null

  const sourcePorts = getNodePorts(sourceNodeType)
  const sourcePort = sourcePorts.outputs.find((port) => port.id === sourceHandleId)
  if (!sourcePort) return null

  const targetPorts = getNodePorts(targetNodeType)
  const compatibleInputs = targetPorts.inputs.filter((port) =>
    areTypesCompatible(sourcePort.type, port.type),
  )

  if (compatibleInputs.length === 0) return null
  if (compatibleInputs.length === 1) return compatibleInputs[0]?.id ?? null

  const ranked = [...compatibleInputs].sort((left, right) => {
    return (
      scoreCandidate(sourceHandleId, right, compatibleInputs.length) -
      scoreCandidate(sourceHandleId, left, compatibleInputs.length)
    )
  })

  return ranked[0]?.id ?? null
}
