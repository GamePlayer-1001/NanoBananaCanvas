# apps/worker/
> L2 | 父级: /CLAUDE.md

Hono API Worker · Cloudflare Workers 运行时

## 成员清单

```
src/index.ts        — Hono 路由入口，CORS/logger 中间件，/health 端点
wrangler.toml       — Worker 部署配置 (D1/R2/Queue 绑定占位)
tsconfig.json       — TypeScript 配置 (@cloudflare/workers-types)
package.json        — 包描述与脚本
```

## 绑定 (P1 阶段启用)

- DB: D1Database — 主数据库
- UPLOADS: R2Bucket — 用户资源存储
- TASK_QUEUE: Queue — 异步任务队列

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
