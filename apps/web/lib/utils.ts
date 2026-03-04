/**
 * [INPUT]: 依赖 clsx 的 ClassValue 类型合并，依赖 tailwind-merge 的冲突解析
 * [OUTPUT]: 对外提供 cn() 样式类名合并工具
 * [POS]: lib 的基础工具函数，被所有 UI 组件消费 (shadcn/ui 标准依赖)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
