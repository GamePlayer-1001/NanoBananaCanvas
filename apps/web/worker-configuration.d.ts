/**
 * [INPUT]: 由 wrangler.jsonc 绑定配置定义
 * [OUTPUT]: 对外提供 CloudflareEnv 类型
 * [POS]: apps/web 的 Cloudflare Workers 绑定类型声明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

interface CloudflareEnv {
  DB: D1Database
  UPLOADS: R2Bucket
  ASSETS: Fetcher
}
