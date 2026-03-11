# apps/worker/

> L2 | 父级: /CLAUDE.md

Hono API Worker + Cron 运维核心 · Cloudflare Workers 运行时

## 成员清单

```
src/index.ts        — Hono 路由入口 + scheduled Cron 调度器
src/cron/           — 三个定时任务 (详见 src/cron/CLAUDE.md)
wrangler.toml       — Worker 部署配置 (D1/R2/KV 绑定 + Cron Triggers)
tsconfig.json       — TypeScript 配置 (@cloudflare/workers-types)
package.json        — 包描述与脚本 (依赖 @nano-banana/shared)
```

## Bindings

- `DB`: D1Database — 主数据库
- `UPLOADS`: R2Bucket — 用户资源存储
- `KV`: KVNamespace — 共享 KV (限流缓存/存储配额)

## Cron Triggers

- `*/10 * * * *` — 每 10 分钟: 积分解冻 + 超时扫描 + 文件清理

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
