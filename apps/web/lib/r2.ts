/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的 getCloudflareContext
 * [OUTPUT]: 对外提供 getR2() 获取 R2Bucket 实例
 * [POS]: lib 的对象存储访问单点入口，被文件上传 API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function getR2(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext()
  return env.UPLOADS
}
