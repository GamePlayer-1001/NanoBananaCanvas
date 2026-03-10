# apps/web/lib/

> L2 | 父级: apps/web/CLAUDE.md

工具函数与配置

## 成员清单

```
errors.ts    — AppError 统一错误类型体系 (NetworkError/AuthError/AIServiceError/WorkflowError/CreditFreezeError/NotFoundError)
logger.ts    — 轻量级日志工具 (开发彩色终端/生产结构化 JSON)
utils.ts     — cn() 样式合并工具 (shadcn 管理)
db.ts        — D1 数据库访问入口 (getDb → getCloudflareContext)
env.ts       — 统一环境变量获取入口 (getEnv/requireEnv → getCloudflareContext，消除 process.env 混用)
r2.ts        — R2 对象存储访问入口 (getR2 → getCloudflareContext)
nanoid.ts    — 零依赖 ID 生成器 (CF Workers 兼容)
stripe.ts            — Stripe SDK 客户端 (getStripe/getOrCreateCustomer/PLAN_CREDITS)
clerk-appearance.ts  — Clerk 登录/注册 UI 外观配置 (卡片样式/品牌色/表单元素)
api/                 — API 路由公共基础设施 (auth 守卫 + response 统一响应，详见子 CLAUDE.md)
credits/     — 积分系统核心引擎 (freeze/debit/refund + crypto + pricing，详见子 CLAUDE.md)
executor/    — 工作流 DAG 执行引擎 (拓扑排序 + 节点执行 + 编排器，详见子 CLAUDE.md)
query/       — TanStack Query 配置与缓存键工厂 (4 文件，详见子 CLAUDE.md)
utils/       — 画布与节点通用工具函数 (4 文件，详见子 CLAUDE.md)
validations/ — Zod 表单验证 Schema (6 文件，详见子 CLAUDE.md)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
