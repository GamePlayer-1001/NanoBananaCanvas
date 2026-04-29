# apps/worker/

> L2 | 父级: /CLAUDE.md

Hono API Worker + Queue + Cron 运维核心 · Cloudflare Workers 运行时

## 成员清单

```
src/index.ts        — Hono 路由入口 + queue 消费者 + scheduled Cron 调度器 + Workflow 导出
src/CLAUDE.md       — src 目录局部地图
src/cron/           — 两个定时任务 (详见 src/cron/CLAUDE.md)
src/queue/          — Cloudflare Queue 消费适配层 (详见 src/queue/CLAUDE.md)
src/workflows/      — Cloudflare Workflows 长任务编排层 (详见 src/workflows/CLAUDE.md)
wrangler.toml       — Worker 部署配置 (D1/R2/KV 绑定 + Cron Triggers + 生产环境变量)
tsconfig.json       — TypeScript 配置 (@cloudflare/workers-types)
package.json        — 包描述与脚本 (依赖 @nano-banana/shared)
```

## Bindings

- `DB`: D1Database — 主数据库
- `UPLOADS`: R2Bucket — 用户资源存储
- `KV`: KVNamespace — 共享 KV (限流缓存/存储配额)

## Cron Triggers

- `*/10 * * * *` — 每 10 分钟: 超时扫描 + 文件清理

## Queue Consumers

- `nano-banana-tasks` — 消费图片生成后台任务，读取 D1 状态与 R2 执行快照，复用 web 任务服务完成真正后台出图

## Workflows

- `nano-banana-image-task` — image_gen 长任务主编排实例，优先由 Workflow 承接长生命周期，再复用共享任务执行内核落地

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
