/**
 * [INPUT]: 依赖 react 的 ReactNode，依赖 next/image 的本地品牌图资源渲染，
 *          依赖 @/lib/seo 的 SITE_NAME，依赖 @/lib/utils 的 cn
 * [OUTPUT]: 对外提供 BrandMark 品牌标识组件 (图形 logo + 字标 / logo only)
 * [POS]: shared 的品牌展示原子组件，被 landing/layout/auth 等模块复用，统一品牌可视入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Image from 'next/image'
import type { ReactNode } from 'react'

import { SITE_NAME } from '@/lib/seo'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  children?: ReactNode
  withLogo?: boolean
  showText?: boolean
  logoClassName?: string
}

export function BrandMark({
  className,
  children = SITE_NAME,
  withLogo = false,
  showText = true,
  logoClassName,
}: BrandMarkProps) {
  const ariaLabel = typeof children === 'string' ? children : SITE_NAME

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[0.55em] leading-none text-current',
        className,
      )}
      aria-label={showText ? undefined : ariaLabel}
    >
      {withLogo ? (
        <Image
          src="/brand/logo-1024.png"
          alt=""
          aria-hidden="true"
          width={1024}
          height={1024}
          className={cn(
            'h-[1.15em] w-auto shrink-0 scale-[1.34] object-contain',
            logoClassName,
          )}
        />
      ) : null}
      {showText ? (
        <span className="font-brand inline-block leading-none tracking-[0.02em] text-current">
          {children}
        </span>
      ) : null}
    </span>
  )
}
