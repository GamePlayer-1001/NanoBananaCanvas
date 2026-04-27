/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next-intl 的 useTranslations，依赖 lucide-react 的 ChevronRight，依赖 ./node-entry-config，依赖 @/lib/utils 的 cn()
 * [OUTPUT]: 对外提供 CanvasContextMenu 画布空白区域右键菜单
 * [POS]: components/canvas 的画布右键菜单，被 Canvas 组件内嵌渲染，支持按当前拖线端口筛选有效节点并展示分类子菜单
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NodeEntryGroup } from './node-entry-config'

/* ─── Types ──────────────────────────────────────────── */

interface CanvasContextMenuProps {
  x: number
  y: number
  groups: NodeEntryGroup[]
  onAddNode: (type: string) => void
  onClose: () => void
}

const ROOT_MENU_WIDTH = 180
const SUB_MENU_WIDTH = 220
const ITEM_HEIGHT = 36
const SUBMENU_OVERLAP = 6
const SUBMENU_CLOSE_DELAY_MS = 120

/* ─── Component ──────────────────────────────────────── */

export function CanvasContextMenu({ x, y, groups, onAddNode, onClose }: CanvasContextMenuProps) {
  const t = useTranslations('contextMenu')
  const ref = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? '')
  const [submenuPosition, setSubmenuPosition] = useState<{ left: number; top: number } | null>(null)

  /* ── 点击外部关闭 ──────────────────────────────────── */
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  /* ── 视口边界修正 ──────────────────────────────────── */
  const menuHeight = Math.max(groups.length, 1) * ITEM_HEIGHT + 16
  const adjustedX = x + ROOT_MENU_WIDTH > window.innerWidth ? x - ROOT_MENU_WIDTH : x
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y

  const resolvedActiveGroupId =
    groups.find((group) => group.id === activeGroupId)?.id ?? groups[0]?.id ?? ''
  const activeGroup = groups.find((group) => group.id === resolvedActiveGroupId) ?? groups[0]

  const openGroup = (group: NodeEntryGroup, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect()
    const submenuHeight = group.items.length * ITEM_HEIGHT + 16
    const openLeft = rect.right + SUB_MENU_WIDTH > window.innerWidth
    const left = openLeft
      ? rect.left - SUB_MENU_WIDTH + SUBMENU_OVERLAP
      : rect.right - SUBMENU_OVERLAP
    const top = Math.min(rect.top, window.innerHeight - submenuHeight - 8)

    setActiveGroupId(group.id)
    setSubmenuPosition({
      left: Math.max(8, left),
      top: Math.max(8, top),
    })
  }

  const cancelScheduledClose = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleSubmenuClose = () => {
    cancelScheduledClose()
    closeTimerRef.current = window.setTimeout(() => {
      setSubmenuPosition(null)
      closeTimerRef.current = null
    }, SUBMENU_CLOSE_DELAY_MS)
  }

  return (
    <div ref={ref}>
      <div
        className={cn(
          'bg-popover text-popover-foreground fixed z-50 min-w-[180px]',
          'rounded-lg border shadow-lg',
          'animate-in fade-in-0 zoom-in-95',
          'py-1',
        )}
        style={{ left: adjustedX, top: adjustedY }}
        onMouseEnter={cancelScheduledClose}
        onMouseLeave={scheduleSubmenuClose}
      >
        {groups.length > 0 ? (
          groups.map((group) => (
            <button
              key={group.id}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                'cursor-pointer transition-colors',
                resolvedActiveGroupId === group.id && 'bg-accent text-accent-foreground',
              )}
              onMouseEnter={(e) => openGroup(group, e.currentTarget)}
              onClick={(e) => openGroup(group, e.currentTarget)}
            >
              <span>{t(group.labelKey)}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
            </button>
          ))
        ) : (
          <div className="text-muted-foreground px-3 py-2 text-sm">{t('noCompatibleNodes')}</div>
        )}
      </div>

      {activeGroup && submenuPosition && groups.length > 0 ? (
        <div
          className={cn(
            'bg-popover text-popover-foreground fixed z-[60] min-w-[220px]',
            'rounded-lg border shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            'py-1',
          )}
          style={submenuPosition}
          onMouseEnter={cancelScheduledClose}
          onMouseLeave={scheduleSubmenuClose}
        >
          {activeGroup.items.map(({ type, labelKey, icon: Icon }) => (
            <button
              key={type}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                'cursor-pointer transition-colors',
              )}
              onClick={() => {
                onAddNode(type)
                onClose()
              }}
            >
              <Icon className="h-4 w-4 opacity-60" />
              {t(labelKey)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
