/**
 * [INPUT]: 由 wrangler.jsonc 绑定配置定义
 * [OUTPUT]: 对外提供 CloudflareEnv 类型 + Cloudflare 绑定类型 (D1/KV/R2/Fetcher)
 * [POS]: apps/web 的 Cloudflare Workers 绑定类型声明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ─── Cloudflare 绑定类型 (最小声明，避免与 DOM 类型冲突) ── */

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
  dump(): Promise<ArrayBuffer>
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = any>(colName?: string): Promise<T | null>
  run<T = any>(): Promise<D1Result<T>>
  all<T = any>(): Promise<D1Result<T>>
  raw<T = any>(options?: { columnNames?: boolean }): Promise<T[]>
}

interface D1Result<T = any> {
  results: T[]
  success: boolean
  meta: {
    duration: number
    last_row_id: number | null
    changes: number | null
    served_by: string
    internal_stats: null
  }
}

interface D1ExecResult {
  count: number
  duration: number
}

interface KVNamespace {
  get(key: string, type: 'text'): Promise<string | null>
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>
  get(key: string, type: 'stream'): Promise<ReadableStream | null>
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | ArrayBuffer | ReadableStream | null>
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream | Blob,
    options?: { expiration?: number; expirationTtl?: number; metadata?: unknown },
  ): Promise<void>
  delete(key: string): Promise<void>
}

interface R2Bucket {
  head(key: string): Promise<R2Object | null>
  get(key: string): Promise<R2ObjectBody | null>
  put(key: string, value: ReadableStream | ArrayBuffer | string | null | Blob, options?: R2PutOptions): Promise<R2Object | null>
  delete(keys: string | string[]): Promise<void>
  list(options?: R2ListOptions): Promise<R2Objects>
}

interface R2Object {
  key: string
  version: string
  size: number
  etag: string
  httpEtag: string
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream
  bodyUsed: boolean
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json<T>(): Promise<T>
  blob(): Promise<Blob>
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
}

interface R2ListOptions {
  limit?: number
  prefix?: string
  cursor?: string
  delimiter?: string
  include?: ('httpMetadata' | 'customMetadata')[]
}

interface R2Objects {
  objects: R2Object[]
  truncated: boolean
  cursor?: string
  delimitedPrefixes: string[]
}

interface R2HTTPMetadata {
  contentType?: string
  contentLanguage?: string
  contentDisposition?: string
  contentEncoding?: string
  cacheControl?: string
  cacheExpiry?: Date
}

/* ─── CloudflareEnv ──────────────────────────────────────── */

interface CloudflareEnv {
  DB: D1Database
  KV: KVNamespace
  UPLOADS: R2Bucket
  ASSETS: Fetcher

  // API Key 加密
  ENCRYPTION_KEY: string

  // 平台 AI Key
  OPENROUTER_API_KEY: string
  OPENAI_API_KEY: string
  KLING_ACCESS_KEY: string
  KLING_SECRET_KEY: string
}
