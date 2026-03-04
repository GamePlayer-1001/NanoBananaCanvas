/**
 * [INPUT]: 依赖 @xyflow/react 的 Node/NodeChange 类型
 * [OUTPUT]: 对外提供 getHelperLines() 对齐辅助线计算、HelperLinesResult 类型
 * [POS]: lib/utils 的画布对齐计算工具，被 Canvas 的 onNodesChange 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Node, NodeChange, XYPosition } from '@xyflow/react'

/* ─── Types ───────────────────────────────────────────── */

export interface HelperLinesResult {
  horizontal?: number
  vertical?: number
  snapPosition: { x?: number; y?: number }
}

/* ─── Constants ───────────────────────────────────────── */

const SNAP_THRESHOLD = 5

/* ─── Helpers ─────────────────────────────────────────── */

/**
 * 从 NodeChange 中提取正在移动的节点和期望位置
 */
function getMovingNodeInfo(
  change: NodeChange,
  nodes: Node[],
): { node: Node; position: XYPosition } | null {
  if (change.type !== 'position' || !change.dragging) return null

  const node = nodes.find((n) => n.id === change.id)
  if (!node) return null

  const position: XYPosition = {
    x: change.position?.x ?? node.position.x,
    y: change.position?.y ?? node.position.y,
  }

  return { node, position }
}

/**
 * 获取节点的边界盒
 */
function getNodeBounds(node: Node, position?: XYPosition) {
  const x = position?.x ?? node.position.x
  const y = position?.y ?? node.position.y
  const w = node.measured?.width ?? node.width ?? 0
  const h = node.measured?.height ?? node.height ?? 0

  return {
    left: x,
    right: x + w,
    top: y,
    bottom: y + h,
    centerX: x + w / 2,
    centerY: y + h / 2,
    width: w,
    height: h,
  }
}

/* ─── Core ────────────────────────────────────────────── */

/**
 * 计算对齐辅助线和吸附位置
 *
 * 检测被拖拽节点与其他节点之间的 5 种对齐关系:
 * - 水平: top-top, bottom-bottom, center-center
 * - 垂直: left-left, right-right, center-center
 *
 * 当距离 < SNAP_THRESHOLD 时触发吸附
 */
export function getHelperLines(change: NodeChange, nodes: Node[]): HelperLinesResult {
  const result: HelperLinesResult = { snapPosition: {} }

  const info = getMovingNodeInfo(change, nodes)
  if (!info) return result

  const moving = getNodeBounds(info.node, info.position)

  let minDistX = SNAP_THRESHOLD
  let minDistY = SNAP_THRESHOLD

  for (const other of nodes) {
    if (other.id === info.node.id) continue

    const target = getNodeBounds(other)

    /* ── 垂直对齐 (X 轴方向吸附) ──────────────────── */
    const xCandidates = [
      { dist: Math.abs(moving.left - target.left), snap: target.left },
      { dist: Math.abs(moving.right - target.right), snap: target.right - moving.width },
      { dist: Math.abs(moving.centerX - target.centerX), snap: target.centerX - moving.width / 2 },
      { dist: Math.abs(moving.left - target.right), snap: target.right },
      { dist: Math.abs(moving.right - target.left), snap: target.left - moving.width },
    ]

    for (const { dist, snap } of xCandidates) {
      if (dist < minDistX) {
        minDistX = dist
        result.snapPosition.x = snap
        result.vertical = snap + moving.width / 2
      }
    }

    /* ── 水平对齐 (Y 轴方向吸附) ──────────────────── */
    const yCandidates = [
      { dist: Math.abs(moving.top - target.top), snap: target.top },
      { dist: Math.abs(moving.bottom - target.bottom), snap: target.bottom - moving.height },
      {
        dist: Math.abs(moving.centerY - target.centerY),
        snap: target.centerY - moving.height / 2,
      },
      { dist: Math.abs(moving.top - target.bottom), snap: target.bottom },
      { dist: Math.abs(moving.bottom - target.top), snap: target.top - moving.height },
    ]

    for (const { dist, snap } of yCandidates) {
      if (dist < minDistY) {
        minDistY = dist
        result.snapPosition.y = snap
        result.horizontal = snap + moving.height / 2
      }
    }
  }

  return result
}
