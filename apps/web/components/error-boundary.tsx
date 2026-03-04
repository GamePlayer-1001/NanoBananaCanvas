/**
 * [INPUT]: 依赖 react 的 Component，依赖 @/lib/logger 的 createLogger
 * [OUTPUT]: 对外提供 ErrorBoundary 组件 + withErrorBoundary HOC
 * [POS]: components 的全局错误捕获层，被 layout 和关键路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { createLogger } from '@/lib/logger'
import { isAppError } from '@/lib/errors'
import { Button } from '@/components/ui/button'

const log = createLogger('ErrorBoundary')

/* ─── Types ───────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode
  /** 自定义 fallback，不传则用默认 UI */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** 错误上报回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/* ─── Component ───────────────────────────────────────── */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const meta = isAppError(error) ? { code: error.code, ...error.meta } : {}

    log.error('Uncaught render error', error, {
      ...meta,
      componentStack: errorInfo.componentStack ?? undefined,
    })

    this.props.onError?.(error, errorInfo)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    const { fallback } = this.props
    if (typeof fallback === 'function') return fallback(error, this.reset)
    if (fallback) return fallback

    return <DefaultFallback error={error} onReset={this.reset} />
  }
}

/* ─── Default Fallback UI ─────────────────────────────── */

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
      <div className="text-center">
        <h3 className="text-destructive text-lg font-semibold">Something went wrong</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {isAppError(error) ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset}>
        Try again
      </Button>
    </div>
  )
}
