/**
 * [INPUT]: 依赖 next-intl/navigation 的 createNavigation，依赖 ./routing
 * [OUTPUT]: 对外提供 i18n 感知的 Link / redirect / usePathname / useRouter / getPathname
 * [POS]: i18n 的导航工具集，替代 next/link 和 next/navigation
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
