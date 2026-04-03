/**
 * [INPUT]: 依赖 @/i18n/navigation 的 Link，依赖 lucide-react 的图标
 * [OUTPUT]: 对外提供 WorkflowCard 可复用工作流卡片组件
 * [POS]: shared 的通用工作流卡，被 explore/workflows/workspace 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 工作流缩略图与作者头像来自动态远程地址，当前不走 Next Image。 */

import { Heart, Copy } from 'lucide-react'

import { Link } from '@/i18n/navigation'

/* ─── Types ──────────────────────────────────────────── */

export interface WorkflowCardData {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  category?: string
  author: {
    name: string
    avatarUrl?: string
  }
  likes?: number
  uses?: number
}

/* ─── Component ──────────────────────────────────────── */

export function WorkflowCard({ data }: { data: WorkflowCardData }) {
  return (
    <Link
      href={`/workflows/${data.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* 缩略图 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {data.thumbnailUrl ? (
          <img
            src={data.thumbnailUrl}
            alt={data.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
            <Copy size={24} className="text-brand-300" />
          </div>
        )}

        {/* 分类标签 */}
        {data.category && (
          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {data.category}
          </span>
        )}
      </div>

      {/* 信息区 */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-foreground">
          {data.name}
        </h3>
        {data.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {data.description}
          </p>
        )}

        {/* 底部信息 */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 overflow-hidden rounded-full bg-muted">
              {data.author.avatarUrl ? (
                <img
                  src={data.author.avatarUrl}
                  alt={data.author.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-100 text-[8px] font-medium text-brand-600">
                  {data.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{data.author.name}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {data.likes !== undefined && (
              <span className="flex items-center gap-0.5">
                <Heart size={12} />
                {data.likes}
              </span>
            )}
            {data.uses !== undefined && (
              <span className="flex items-center gap-0.5">
                <Copy size={12} />
                {data.uses}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
