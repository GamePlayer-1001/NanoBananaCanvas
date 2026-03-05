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

  // Stripe
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string

  // API Key 加密
  ENCRYPTION_KEY: string

  // 平台 AI Key (积分模式)
  OPENROUTER_API_KEY: string

  // Stripe Price IDs (Dashboard 手动创建)
  STRIPE_PRICE_STANDARD_MONTHLY: string
  STRIPE_PRICE_STANDARD_YEARLY: string
  STRIPE_PRICE_PRO_MONTHLY: string
  STRIPE_PRICE_PRO_YEARLY: string
  STRIPE_PRICE_ULTIMATE_MONTHLY: string
  STRIPE_PRICE_ULTIMATE_YEARLY: string
}
