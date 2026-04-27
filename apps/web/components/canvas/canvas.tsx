/**
 * [INPUT]: 依赖 @xyflow/react 的 ReactFlow/MiniMap 引擎，依赖 @/stores/use-flow-store 的画布状态，
 *          依赖 @/stores/use-canvas-tool-store 的工具状态，依赖 @/hooks/use-context-menu 的菜单状态，
 *          依赖 @/hooks/use-auto-save 的自动保存 (localStorage + 云端双轨)，
 *          依赖 @/lib/utils/create-node 的节点工厂，依赖 @/lib/utils/get-helper-lines 的对齐计算，
 *          依赖 @/lib/utils/validate-connection 的连接验证，依赖 @/lib/utils/filter-node-entry-groups 的候选节点筛选，
 *          依赖 @/types 的 WorkflowNode/WorkflowEdge
 * [OUTPUT]: 对外提供 Canvas 主画布组件 (含右键菜单 + 拖拽连线创建节点 + 按端口类型筛选有效候选 + 辅助线 + MiniMap + 顶部/底部工具栏)
 * [POS]: components/canvas 的核心渲染器，被 workspace/[id] 页面消费，接收 workflowId 驱动云端保存
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
  Background,
  BackgroundVariant,
  type Connection,
  type HandleType,
  MiniMap,
  type NodeChange,
  type OnConnectStartParams,
  ReactFlow,
  type ReactFlowInstance,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react'
import type { WorkflowNode, WorkflowEdge } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { useCanvasToolStore } from '@/stores/use-canvas-tool-store'
import { useContextMenu } from '@/hooks/use-context-menu'
import { createNode } from '@/lib/utils/create-node'
import { filterNodeEntryGroupsByPort } from '@/lib/utils/filter-node-entry-groups'
import { getHelperLines } from '@/lib/utils/get-helper-lines'
import {
  resolveAutoConnectSourceHandle,
  resolveAutoConnectTargetHandle,
} from '@/lib/utils/resolve-auto-connect-handle'
import { isValidConnection } from '@/lib/utils/validate-connection'
import { useAutoSave, useCloudSaveStatus } from '@/hooks/use-auto-save'
import { useCanvasShortcuts } from '@/hooks/use-canvas-shortcuts'
import { useThumbnailCapture } from '@/hooks/use-thumbnail-capture'
import { ErrorBoundary } from '@/components/error-boundary'
import { CanvasControls } from './canvas-controls'
import { CANVAS_CONTEXT_MENU_GROUPS } from './node-entry-config'
import { CanvasToolbar, DRAG_DATA_TYPE } from './canvas-toolbar'
import { CanvasTopToolbar } from './canvas-top-toolbar'
import { HelperLines } from './helper-lines'
import { CanvasContextMenu } from './context-menu'
import { NodeContextMenu } from './node-context-menu'
import { NODE_TYPES } from '../nodes/registry'
import { EDGE_TYPES } from '../edges/registry'

import '@/styles/reactflow.css'

/* ─── Types ──────────────────────────────────────────── */

type FlowInstance = ReactFlowInstance<WorkflowNode, WorkflowEdge>
type PendingConnection = {
  nodeId: string
  handleId: string | null
  handleType: HandleType
}

/* ─── Constants ───────────────────────────────────────── */

const SNAP_GRID: [number, number] = [20, 20]
const MIN_ZOOM = 0.1
const MAX_ZOOM = 2
const DUPLICATE_OFFSET = 50
const SHORTCUT_HINT_STORAGE_KEY = 'nano-banana.canvas-shortcut-hint-views'
const SHORTCUT_HINT_MARKER_KEY = 'nano-banana.canvas-shortcut-hint-last-open'
const MAX_SHORTCUT_HINT_VIEWS = 3

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

/* ─── Types ──────────────────────────────────────────── */

interface CanvasProps {
  workflowId?: string
  canEdit?: boolean
}

/* ─── Inner Component (needs ReactFlowProvider context) ─ */

function CanvasInner({ workflowId, canEdit = true }: CanvasProps) {
  const rfInstance = useRef<FlowInstance | null>(null)
  const connectingFrom = useRef<PendingConnection | null>(null)
  const t = useTranslations('canvas.shortcutsHint')
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setViewport, addNode, removeNode } =
    useFlowStore()
  const activeTool = useCanvasToolStore((s) => s.activeTool)
  const resetTool = useCanvasToolStore((s) => s.resetTool)
  const { menu, openPaneMenu, openNodeMenu, close: closeMenu } = useContextMenu()
  const { screenToFlowPosition } = useReactFlow()
  /* ── 自动保存 (localStorage + 云端双轨) ────────────── */
  useAutoSave(workflowId, canEdit)

  /* ── 全局快捷键 (Ctrl+Enter/Esc/Ctrl+S/Ctrl+O) ───── */
  useCanvasShortcuts(workflowId)

  /* ── 云保存成功后自动生成缩略图 ──────────────────── */
  const { capture } = useThumbnailCapture(workflowId)
  const saveStatus = useCloudSaveStatus((s) => s.status)
  const [helperLines, setHelperLines] = useState<{
    horizontal?: number
    vertical?: number
  }>({})
  const [isSpacePanning, setIsSpacePanning] = useState(false)
  const [showShortcutHint, setShowShortcutHint] = useState(false)
  const [contextMenuGroups, setContextMenuGroups] = useState(CANVAS_CONTEXT_MENU_GROUPS)

  useEffect(() => {
    if (saveStatus === 'saved') capture()
  }, [saveStatus, capture])

  useEffect(() => {
    let frameId = 0

    try {
      const rawCount = window.localStorage.getItem(SHORTCUT_HINT_STORAGE_KEY)
      const currentCount = Number.parseInt(rawCount ?? '0', 10)
      const safeCount = Number.isNaN(currentCount) ? 0 : currentCount
      const shouldShow = safeCount < MAX_SHORTCUT_HINT_VIEWS

      frameId = window.requestAnimationFrame(() => {
        setShowShortcutHint(shouldShow)
      })

      if (!shouldShow) {
        return () => {
          window.cancelAnimationFrame(frameId)
        }
      }

      const now = Date.now()
      const rawLastOpen = window.sessionStorage.getItem(SHORTCUT_HINT_MARKER_KEY)
      const lastOpen = Number.parseInt(rawLastOpen ?? '0', 10)
      const shouldCountOpen = Number.isNaN(lastOpen) || now - lastOpen > 1500

      window.sessionStorage.setItem(SHORTCUT_HINT_MARKER_KEY, String(now))

      if (shouldCountOpen) {
        window.localStorage.setItem(
          SHORTCUT_HINT_STORAGE_KEY,
          String(safeCount + 1),
        )
      }
    } catch {
      frameId = window.requestAnimationFrame(() => {
        setShowShortcutHint(true)
      })
    }

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isEditableTarget(event.target)) return
      event.preventDefault()
      setIsSpacePanning(true)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      setIsSpacePanning(false)
    }

    const onWindowBlur = () => {
      setIsSpacePanning(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onWindowBlur)
    }
  }, [])

  const onInit = useCallback((instance: FlowInstance) => {
    rfInstance.current = instance
  }, [])

  /* ── 连接验证 (EDGE-003) ──────────────────────────── */
  const validateConnection = useCallback(
    (edge: WorkflowEdge | Connection) =>
      isValidConnection(
        {
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? null,
          targetHandle: edge.targetHandle ?? null,
        },
        nodes,
        edges,
      ),
    [nodes, edges],
  )

  /* ── 画布空白区右键 → 打开 Pane 菜单 ──────────────── */
  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault()
      connectingFrom.current = null
      setContextMenuGroups(CANVAS_CONTEXT_MENU_GROUPS)
      openPaneMenu({
        preventDefault: () => {},
        clientX: event.clientX,
        clientY: event.clientY,
      } as React.MouseEvent)
    },
    [openPaneMenu],
  )

  /* ── 节点右键 → 打开 Node 菜单 ────────────────────── */
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: WorkflowNode) => {
      openNodeMenu(event, node.id)
    },
    [openNodeMenu],
  )

  /* ── Node 菜单: 复制节点 ───────────────────────────── */
  const handleDuplicateNode = useCallback(() => {
    if (!menu.nodeId) return
    const source = nodes.find((n) => n.id === menu.nodeId)
    if (!source) return

    const node = createNode(source.type ?? 'text-input', {
      x: source.position.x + DUPLICATE_OFFSET,
      y: source.position.y + DUPLICATE_OFFSET,
    })
    node.data = { ...source.data }
    addNode(node)
  }, [menu.nodeId, nodes, addNode])

  /* ── Node 菜单: 删除节点 ───────────────────────────── */
  const handleDeleteNode = useCallback(() => {
    if (menu.nodeId) removeNode(menu.nodeId)
  }, [menu.nodeId, removeNode])

  /* ── MENU-005: 拖拽连线到空白区 → 创建节点并自动连接 ─ */
  const handleConnectStart = useCallback(
    (_: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
      connectingFrom.current =
        params.nodeId && params.handleType
          ? {
              nodeId: params.nodeId,
              handleId: params.handleId ?? null,
              handleType: params.handleType,
            }
          : null
    },
    [],
  )

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingFrom.current) return

      const target = event.target as HTMLElement
      /* 如果释放在已有节点/Handle 上，ReactFlow 自动处理连接，无需干预 */
      if (target.closest('.react-flow__handle') || target.closest('.react-flow__node')) {
        connectingFrom.current = null
        return
      }

      /* 获取鼠标/触摸位置 */
      const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX
      const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY

      /* 在拖拽释放位置打开 Pane 菜单 */
      const currentNode = useFlowStore
        .getState()
        .nodes.find((item) => item.id === connectingFrom.current?.nodeId)

      setContextMenuGroups(
        connectingFrom.current && currentNode?.type
          ? filterNodeEntryGroupsByPort(CANVAS_CONTEXT_MENU_GROUPS, {
              nodeType: currentNode.type,
              handleId: connectingFrom.current.handleId,
              handleType: connectingFrom.current.handleType,
            })
          : CANVAS_CONTEXT_MENU_GROUPS,
      )

      openPaneMenu({
        preventDefault: () => {},
        clientX,
        clientY,
      } as React.MouseEvent)
    },
    [openPaneMenu],
  )

  /* ── Enhanced onNodesChange with helper lines ──────── */
  type WfNodeChange = NodeChange<WorkflowNode>

  const handleNodesChange = useCallback(
    (changes: WfNodeChange[]) => {
      const positionChange = changes.find(
        (c): c is Extract<WfNodeChange, { type: 'position' }> =>
          c.type === 'position' && 'dragging' in c && c.dragging === true,
      )

      if (positionChange) {
        const result = getHelperLines(positionChange, nodes)
        setHelperLines({
          horizontal: result.horizontal,
          vertical: result.vertical,
        })

        /* 应用吸附位置 */
        if (result.snapPosition.x != null || result.snapPosition.y != null) {
          const snapped = changes.map((c) => {
            if (c.type === 'position' && 'id' in c && c.id === positionChange.id && c.position) {
              return {
                ...c,
                position: {
                  x: result.snapPosition.x ?? c.position.x,
                  y: result.snapPosition.y ?? c.position.y,
                },
              }
            }
            return c
          })
          onNodesChange(snapped)
          return
        }
      } else {
        /* 非拖拽操作时清除辅助线 */
        setHelperLines({})
      }

      onNodesChange(changes)
    },
    [nodes, onNodesChange],
  )

  /* ── CANVAS-012: Toolbar drag & drop to create node ── */
  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()

      const nodeType = e.dataTransfer.getData(DRAG_DATA_TYPE)
      if (!nodeType) return

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      const node = createNode(nodeType, position)
      addNode(node)
      resetTool()
    },
    [screenToFlowPosition, addNode, resetTool],
  )

  /* ── 添加节点 (支持自动连接) ────────────────────────── */
  const handleAddNodeWithConnection = useCallback(
    (type: string) => {
      const position = screenToFlowPosition({ x: menu.x, y: menu.y })
      const node = createNode(type, position)
      addNode(node)

      /* 如果是从连线拖拽触发，自动创建边 */
      if (connectingFrom.current) {
        const pendingConnection = connectingFrom.current
        const currentNode = useFlowStore
          .getState()
          .nodes.find((item) => item.id === pendingConnection.nodeId)

        if (currentNode?.type) {
          const connection: Connection =
            pendingConnection.handleType === 'source'
              ? {
                  source: pendingConnection.nodeId,
                  sourceHandle: pendingConnection.handleId,
                  target: node.id,
                  targetHandle: resolveAutoConnectTargetHandle(
                    currentNode.type,
                    pendingConnection.handleId,
                    type,
                  ),
                }
              : {
                  source: node.id,
                  sourceHandle: resolveAutoConnectSourceHandle(
                    currentNode.type,
                    pendingConnection.handleId,
                    type,
                  ),
                  target: pendingConnection.nodeId,
                  targetHandle: pendingConnection.handleId,
                }

          useFlowStore.getState().onConnect(connection)
        }

        connectingFrom.current = null
      }
    },
    [menu.x, menu.y, screenToFlowPosition, addNode],
  )

  const handleContextMenuClose = useCallback(() => {
    connectingFrom.current = null
    setContextMenuGroups(CANVAS_CONTEXT_MENU_GROUPS)
    closeMenu()
  }, [closeMenu])

  const effectiveTool = isSpacePanning ? 'hand' : activeTool
  const isHandTool = effectiveTool === 'hand'
  const isSelectTool = effectiveTool === 'select'
  const shortcutItems = [
    { key: 'Space', action: t('pan') },
    { key: 'Del / Backspace', action: t('delete') },
    { key: 'Ctrl+Z', action: t('undo') },
    { key: 'Ctrl+Shift+Z', action: t('redo') },
    { key: 'Ctrl+Enter', action: t('run') },
    { key: 'Esc', action: t('stop') },
    { key: 'Ctrl+S', action: t('export') },
    { key: 'Ctrl+O', action: t('import') },
  ]

  return (
    <div className="relative h-full w-full">
      {showShortcutHint ? (
        <div className="pointer-events-none absolute bottom-5 left-5 z-0 max-w-[22rem] text-[13px] leading-6 text-black/36">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-black/24">
            {t('title')}
          </p>
          <ul className="mt-2 space-y-1">
            {shortcutItems.map((item) => (
              <li key={item.key} className="flex items-start gap-3">
                <span className="min-w-[8.4rem] font-mono text-[12px] text-black/42">
                  {item.key}
                </span>
                <span>{item.action}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ReactFlow
        className={isHandTool ? 'relative z-10 [&_svg]:cursor-grab [&_.react-flow__pane]:cursor-grab [&_.react-flow__node]:cursor-grab active:[&_.react-flow__pane]:cursor-grabbing active:[&_.react-flow__node]:cursor-grabbing' : 'relative z-10 [&_.react-flow__pane]:cursor-default'}
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={validateConnection}
        onInit={onInit}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        /* ── 右键菜单事件 ────────────────────────────── */
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handleContextMenuClose}
        /* ── 拖拽连线事件 (MENU-005) ─────────────────── */
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        /* ── 工具栏拖放 (CANVAS-012) ─────────────────── */
        onDragOver={onDragOver}
        onDrop={onDrop}
        /* ── 交互行为 ──────────────────────────────── */
        selectionMode={SelectionMode.Partial}
        panOnScroll={false}
        panOnDrag={isHandTool ? [0, 1, 2] : [1, 2]}
        selectionOnDrag={isSelectTool}
        nodesDraggable={!isHandTool}
        elementsSelectable={!isHandTool}
        snapToGrid
        snapGrid={SNAP_GRID}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={['Backspace', 'Delete']}
        /* ── 连线默认 ──────────────────────────────── */
        defaultEdgeOptions={{ type: 'custom', animated: false }}
        connectionLineStyle={{ stroke: 'var(--brand-400)', strokeWidth: 2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <HelperLines horizontal={helperLines.horizontal} vertical={helperLines.vertical} />
        <MiniMap
          position="bottom-right"
          className="!bottom-16 !right-2"
          pannable
          zoomable
          nodeColor="var(--brand-400)"
          maskColor="rgba(0, 0, 0, 0.15)"
        />
        <CanvasTopToolbar workflowId={workflowId} />
        <CanvasToolbar />
        <CanvasControls />
      </ReactFlow>

      {/* ── 上下文菜单层 ──────────────────────────────── */}
      {menu.show && menu.type === 'pane' && (
        <CanvasContextMenu
          x={menu.x}
          y={menu.y}
          groups={contextMenuGroups}
          onAddNode={handleAddNodeWithConnection}
          onClose={handleContextMenuClose}
        />
      )}
      {menu.show && menu.type === 'node' && (
        <NodeContextMenu
          x={menu.x}
          y={menu.y}
          onDuplicate={handleDuplicateNode}
          onDelete={handleDeleteNode}
          onClose={closeMenu}
        />
      )}
    </div>
  )
}

/* ─── Exported Component ─────────────────────────────── */

export function Canvas({ workflowId, canEdit }: CanvasProps) {
  return (
    <ErrorBoundary>
      <CanvasInner workflowId={workflowId} canEdit={canEdit} />
    </ErrorBoundary>
  )
}
