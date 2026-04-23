/**
 * [INPUT]: 依赖 react 的 ReactNode，依赖 @/lib/seo 的 SITE_NAME，依赖 @/lib/utils 的 cn
 * [OUTPUT]: 对外提供 BrandMark 品牌字标组件
 * [POS]: shared 的品牌展示原子组件，被 landing/layout/auth 等模块复用，统一品牌字体语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ReactNode } from 'react'

import { SITE_NAME } from '@/lib/seo'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  children?: ReactNode
}

export function BrandMark({ className, children = SITE_NAME }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'font-brand inline-block leading-none tracking-[0.02em] text-current',
        className,
      )}
    >
      {children}
    </span>
  )
}
