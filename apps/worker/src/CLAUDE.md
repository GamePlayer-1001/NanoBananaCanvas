# src/
> L2 | 父级: apps/worker/CLAUDE.md

成员清单
index.ts: Worker 主入口，承接 HTTP 路由、Queue 消费、Workflow 导出与 Cron 调度
cron/: 定时任务子模块，负责超时任务扫描与过期输出清理
queue/: Queue 消费适配层，把 Cloudflare Queue 消息桥接到共享任务服务
workflows/: Cloudflare Workflows 编排层，负责长任务主调度骨架

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
