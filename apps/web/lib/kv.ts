/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的 getCloudflareContext
 * [OUTPUT]: 对外提供 getKV() 获取 KVNamespace 实例
 * [POS]: lib 的 KV 访问单点入口，被限流器和存储配额缓存消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function getKV(): Promise<KVNamespace> {
  const { env } = await getCloudflareContext()
  return env.KV
}