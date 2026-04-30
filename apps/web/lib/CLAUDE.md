# apps/web/lib/

> L2 | 父级: apps/web/CLAUDE.md

工具函数与配置

## 成员清单

```
errors.ts    — AppError 统一错误类型体系 (NetworkError/AuthError/AIServiceError/WorkflowError/NotFoundError)
logger.ts    — 轻量级日志工具 (开发彩色终端/生产结构化 JSON)
utils.ts     — cn() 样式合并工具 (shadcn 管理)
db.ts        — D1 数据库访问入口 (getDb → getCloudflareContext)
seo.ts       — SEO 语义层 (BASE_URL/metadata 工厂/多语言 canonical+hreflang/OG URL/locale 感知高优先级关键词策略/公开索引策略统一出口)
l10n.ts      — 业务字段本地化工具 (name_i18n JSON 真相源优先 + name_en/name_zh 历史回退链)
env.ts       — 统一环境变量获取入口 (getEnv/requireEnv → getCloudflareContext，消除 process.env 混用并净化 BOM 污染；共享任务逻辑现通过 runtime adapter 复用于 worker)
r2.ts        — R2 对象存储访问入口 (getR2 → getCloudflareContext；任务快照/输出由共享 service 注入 runtime 后跨 web+worker 复用)
storage.ts   — 存储路径/私有文件 URL 解析/配额缓存/输出清理与失效工具（任务系统额外使用内部 `task-inputs/` 快照，不计入用户配额）
nanoid.ts    — 零依赖 ID 生成器 (CF Workers 兼容)
api-key-crypto.ts   — API Key 服务端 AES-256-GCM 加密层 (encrypt/decrypt/mask)
user-model-config.ts — 账号级模型配置契约层 (兼容旧槽位 + 多配置能力标记 + 加密负载 JSON 编解码 + URL 规范化)
guest-model-config.ts — 访客本地临时模型配置层 (localStorage 真相源 + 多配置读写 + 脱敏公开视图 + 运行时配置转换)
model-config-catalog.ts — API 接入配置目录 (四类能力卡片 + provider 选项 + 标签查找)
platform-models.ts — 平台模型目录语义层 (/api/ai/models 单一真相源的共享类型、Provider 分组与默认选中解析)
ai-node-config.ts — AI 节点配置语义层 (platformProvider/platformModel 与 capability/userKeyConfigId 分离 + 旧工作流兼容解析 + 失效用户配置自动回退)
image-model-capabilities.ts — 图片模型能力真相源 (显示分辨率预设 + 模型名润色 + 静态能力表 + 前后端校验 + 运行时错误学习解析)
ai-node-config.test.ts — AI 节点配置语义测试 (验证新字段优先级、旧字段迁移兼容、平台/用户模式隔离)
l10n.test.ts — L10N 语义测试 (业务字段 locale 回退链 + 多语言值映射)
image-model-capabilities.test.ts — 图片能力测试 (尺寸解析 + 动态护栏 + 错误学习回归)
api/                 — API 路由公共基础设施 (auth 守卫 + response 统一响应，详见子 CLAUDE.md)
billing/     — Stripe 计费服务层 (配置解析 + 套餐权益 + Stripe client + Checkout/公开价格目录，详见子 CLAUDE.md)
auth/        — 身份桥接层 (Clerk/匿名 identity adapter + SessionActor 门面 + route guard + redirect 策略，详见子 CLAUDE.md)
agent/       — Agent 编排语义层 (画布摘要 / 计划构建 / 校验 / 落图 / 变更解释，详见子 CLAUDE.md)
executor/    — 工作流 DAG 执行引擎 (拓扑排序 + 节点执行 + 编排器，详见子 CLAUDE.md)
query/       — TanStack Query 配置与缓存键工厂 (4 文件，详见子 CLAUDE.md)
utils/       — 画布与节点通用工具函数 (4 文件，详见子 CLAUDE.md)
validations/ — Zod 表单验证 Schema (7 文件，详见子 CLAUDE.md)
tasks/       — P2 异步任务队列核心 (D1 状态机 + Workflow/Queue 双轨编排 + Worker 分发桥 + 客户端轮询，详见子 CLAUDE.md)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
