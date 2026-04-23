/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的 getCloudflareContext
 * [OUTPUT]: 对外提供 getEnv() 统一环境变量获取入口
 * [POS]: lib 的环境变量单点入口，消除 process.env vs getCloudflareContext 混用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

/* ─── Unified Env Access ─────────────────────────────── */

/**
 * 统一的环境变量获取入口
 *
 * 内部优先通过 getCloudflareContext() 读取 Cloudflare Workers 环境变量
 * 本地开发时如果 Cloudflare context 尚未注入，则回退到 process.env
 * 生产环境由 wrangler.toml [vars] 和 secrets 提供
 */
export async function getEnv(key: string): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext()
    const runtimeValue = (env as unknown as Record<string, string | undefined>)[key]
    if (runtimeValue != null) {
      return runtimeValue
    }
  } catch {
    // 本地 next dev / vitest 无 Cloudflare context 时继续回退
  }

  return process.env[key]
}

/**
 * 获取必需的环境变量，缺失时抛出明确错误
 */
export async function requireEnv(key: string): Promise<string> {
  const value = await getEnv(key)
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}
