/**
 * [INPUT]: 依赖 ./errors 的 AppError/isAppError
 * [OUTPUT]: 对外提供 logger 单例 (debug/info/warn/error) + createLogger 工厂
 * [POS]: lib 的日志基础设施，被所有业务模块消费，后期可对接 Sentry/Logpush
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { isAppError } from './errors'

/* ─── Types ───────────────────────────────────────────── */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  scope: string
  message: string
  data?: Record<string, unknown>
  error?: { name: string; code?: string; message: string; stack?: string }
  timestamp: string
}

interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => void
}

/* ─── Config ──────────────────────────────────────────── */

// NOTE: Next.js bundler statically replaces process.env.NODE_ENV at build time,
// so this becomes a literal boolean in Cloudflare Workers runtime — safe to use.
const IS_DEV =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
const IS_SERVER = typeof window === 'undefined'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LEVEL: LogLevel = IS_DEV ? 'debug' : 'info'

/* ─── Formatters ──────────────────────────────────────── */

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
}
const RESET = '\x1b[0m'

function formatDev(entry: LogEntry): string {
  const color = LEVEL_COLORS[entry.level]
  const level = entry.level.toUpperCase().padEnd(5)
  return `${color}[${level}]${RESET} [${entry.scope}] ${entry.message}`
}

function serializeError(err: unknown): LogEntry['error'] | undefined {
  if (!err) return undefined
  if (isAppError(err)) {
    return { name: err.name, code: err.code, message: err.message, stack: err.stack }
  }
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return { name: 'Unknown', message: String(err) }
}

/* ─── Core ────────────────────────────────────────────── */

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function emit(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return

  if (IS_DEV) {
    const formatted = formatDev(entry)
    const method = entry.level === 'debug' ? 'log' : entry.level
    if (entry.data) {
      console[method](formatted, entry.data)
    } else {
      console[method](formatted)
    }
    if (entry.error?.stack) {
      console[method](entry.error.stack)
    }
  } else {
    // 生产环境：结构化 JSON，可被 Cloudflare Logpush / Sentry 采集
    const output = { ...entry }
    if (output.error?.stack && IS_SERVER) {
      // 服务端保留 stack，客户端仅报 message
    } else if (output.error?.stack) {
      delete output.error.stack
    }
    console[entry.level === 'debug' ? 'log' : entry.level](JSON.stringify(output))
  }
}

/* ─── Factory ─────────────────────────────────────────── */

export function createLogger(scope: string): Logger {
  const makeEntry = (
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: unknown,
  ): LogEntry => ({
    level,
    scope,
    message,
    data,
    error: serializeError(error),
    timestamp: new Date().toISOString(),
  })

  return {
    debug: (message, data) => emit(makeEntry('debug', message, data)),
    info: (message, data) => emit(makeEntry('info', message, data)),
    warn: (message, data) => emit(makeEntry('warn', message, data)),
    error: (message, error, data) => emit(makeEntry('error', message, data, error)),
  }
}

/* ─── Default Instance ────────────────────────────────── */

export const logger = createLogger('app')
