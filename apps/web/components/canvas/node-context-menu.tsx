/**
 * [INPUT]: 依赖 react 的 useEffect/useRef，依赖 next-intl 的 useTranslations，依赖 lucide-react 图标，依赖 @/lib/utils 的 cn()
 * [OUTPUT]: 对外提供 NodeContextMenu 节点右键菜单
 * [POS]: components/canvas 的节点右键菜单，被 Canvas 组件内嵌渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Types ──────────────────────────────────────────── */

interface NodeContextMenuProps {
  x: number
  y: number
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

/* ─── Component ──────────────────────────────────────── */

export function NodeContextMenu({
  x,
  y,
  onDuplicate,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const t = useTranslations('contextMenu')
  const ref = useRef<HTMLDivElement>(null)

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

  /* ── 视口边界修正 ──────────────────────────────────── */
  const menuWidth = 180
  const menuHeight = 88
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y

  return (
    <div
      ref={ref}
      className={cn(
        'bg-popover text-popover-foreground fixed z-50 min-w-[180px]',
        'rounded-lg border shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'py-1',
      )}
      style={{ left: adjustedX, top: adjustedY }}
    >
      <button
        className={cn(
          'flex w-full items-center gap-3 px-3 py-2 text-sm',
          'hover:bg-accent hover:text-accent-foreground',
          'cursor-pointer transition-colors',
        )}
        onClick={() => {
          onDuplicate()
          onClose()
        }}
      >
        <Copy className="h-4 w-4 opacity-60" />
        {t('duplicate')}
      </button>

      <div className="bg-border mx-2 my-1 h-px" />

      <button
        className={cn(
          'flex w-full items-center gap-3 px-3 py-2 text-sm',
          'text-destructive hover:bg-destructive/10',
          'cursor-pointer transition-colors',
        )}
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <Trash2 className="h-4 w-4 opacity-60" />
        {t('delete')}
      </button>
    </div>
  )
}
