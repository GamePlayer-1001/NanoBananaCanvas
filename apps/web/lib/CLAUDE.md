# apps/web/lib/

> L2 | 父级: apps/web/CLAUDE.md

工具函数与配置

## 成员清单

```
errors.ts    — AppError 统一错误类型体系 (NetworkError/AuthError/AIServiceError/WorkflowError/NotFoundError)
logger.ts    — 轻量级日志工具 (开发彩色终端/生产结构化 JSON)
utils.ts     — cn() 样式合并工具 (shadcn 管理)
db.ts        — D1 数据库访问入口 (getDb → getCloudflareContext)
env.ts       — 统一环境变量获取入口 (getEnv/requireEnv → getCloudflareContext，消除 process.env 混用)
r2.ts        — R2 对象存储访问入口 (getR2 → getCloudflareContext)
storage.ts   — 存储路径/私有文件 URL 解析/配额缓存/输出清理与失效工具
nanoid.ts    — 零依赖 ID 生成器 (CF Workers 兼容)
api-key-crypto.ts   — API Key 服务端 AES-256-GCM 加密层 (encrypt/decrypt/mask)
user-model-config.ts — 账号级模型配置契约层 (兼容旧槽位 + 多配置能力标记 + 加密负载 JSON 编解码 + URL 规范化)
model-config-catalog.ts — API 接入配置目录 (四类能力卡片 + provider 选项 + 标签查找)
ai-node-config.ts — AI 节点配置语义层 (platformProvider/platformModel 与 capability/userKeyConfigId 分离 + 旧工作流兼容解析 + 失效用户配置自动回退)
ai-node-config.test.ts — AI 节点配置语义测试 (验证新字段优先级、旧字段迁移兼容、平台/用户模式隔离)
api/                 — API 路由公共基础设施 (auth 守卫 + response 统一响应，详见子 CLAUDE.md)
auth/        — 身份桥接层 (Clerk/匿名 identity adapter + SessionActor 门面 + route guard + redirect 策略，详见子 CLAUDE.md)
executor/    — 工作流 DAG 执行引擎 (拓扑排序 + 节点执行 + 编排器，详见子 CLAUDE.md)
query/       — TanStack Query 配置与缓存键工厂 (4 文件，详见子 CLAUDE.md)
utils/       — 画布与节点通用工具函数 (4 文件，详见子 CLAUDE.md)
validations/ — Zod 表单验证 Schema (7 文件，详见子 CLAUDE.md)
tasks/       — P2 异步任务队列核心 (D1-as-Queue + 客户端轮询，详见子 CLAUDE.md)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
