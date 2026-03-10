/**
 * [INPUT]: 依赖 react 的 useEffect/useRef，依赖 next-intl 的 useTranslations，依赖 lucide-react 图标，依赖 @/lib/utils 的 cn()
 * [OUTPUT]: 对外提供 CanvasContextMenu 画布空白区域右键菜单
 * [POS]: components/canvas 的画布右键菜单，被 Canvas 组件内嵌渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { BrainCircuit, ImageIcon, MonitorPlay, Type, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Types ──────────────────────────────────────────── */

interface CanvasContextMenuProps {
  x: number
  y: number
  onAddNode: (type: string) => void
  onClose: () => void
}

/* ─── Menu Item Definition ───────────────────────────── */

const MENU_ITEMS = [
  { type: 'text-input', labelKey: 'addTextInput' as const, icon: Type },
  { type: 'llm', labelKey: 'addLLM' as const, icon: BrainCircuit },
  { type: 'display', labelKey: 'addDisplay' as const, icon: MonitorPlay },
  { type: 'image-gen', labelKey: 'addImageGen' as const, icon: ImageIcon },
  { type: 'video-gen', labelKey: 'addVideoGen' as const, icon: Video },
] as const

/* ─── Component ──────────────────────────────────────── */

export function CanvasContextMenu({ x, y, onAddNode, onClose }: CanvasContextMenuProps) {
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
  const menuWidth = 200
  const menuHeight = MENU_ITEMS.length * 36 + 16
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y

  return (
    <div
      ref={ref}
      className={cn(
        'bg-popover text-popover-foreground fixed z-50 min-w-[200px]',
        'rounded-lg border shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'py-1',
      )}
      style={{ left: adjustedX, top: adjustedY }}
    >
      {MENU_ITEMS.map(({ type, labelKey, icon: Icon }) => (
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
  )
}
