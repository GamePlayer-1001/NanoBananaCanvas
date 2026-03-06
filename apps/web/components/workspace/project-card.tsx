/**
 * [INPUT]: 依赖 @/i18n/navigation 的 Link，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 ProjectCard 项目卡片组件
 * [POS]: workspace 的项目卡片，被 workspace-grid.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { Clock, Image as ImageIcon } from 'lucide-react'

import { Link } from '@/i18n/navigation'

/* ─── Types ──────────────────────────────────────────── */

export interface ProjectCardData {
  id: string
  name: string
  thumbnailUrl?: string
  updatedAt: string
}

/* ─── Component ──────────────────────────────────────── */

export function ProjectCard({ data }: { data: ProjectCardData }) {
  return (
    <Link href={`/canvas/${data.id}`} className="group block">
      {/* 缩略图 */}
      <div className="relative aspect-[246/160] overflow-hidden rounded-xl border border-border bg-muted transition-shadow group-hover:shadow-md">
        {data.thumbnailUrl ? (
          <img
            src={data.thumbnailUrl}
            alt={data.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={28} className="text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* 名称 + 时间 */}
      <div className="mt-2">
        <h3 className="truncate text-sm font-medium text-foreground">
          {data.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={11} />
          {data.updatedAt}
        </p>
      </div>
    </Link>
  )
}
