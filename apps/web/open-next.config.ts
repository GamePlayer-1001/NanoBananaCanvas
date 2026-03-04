/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的 defineCloudflareConfig
 * [OUTPUT]: 对外提供 OpenNext Cloudflare 适配配置
 * [POS]: apps/web 的 Cloudflare Pages 部署适配层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig({})
