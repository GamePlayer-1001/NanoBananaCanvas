/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的 getCloudflareContext
 * [OUTPUT]: 对外提供 getDb() 获取 D1 实例
 * [POS]: lib 的数据库访问单点入口，被所有 API route handlers 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext()
  return env.DB
}
