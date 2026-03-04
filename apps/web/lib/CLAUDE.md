# apps/web/lib/

> L2 | 父级: apps/web/CLAUDE.md

工具函数与配置

## 成员清单

```
errors.ts                   — AppError 统一错误类型体系 (NetworkError/AuthError/AIServiceError/WorkflowError)
logger.ts                   — 轻量级日志工具 (开发彩色终端/生产结构化 JSON)，后期可对接 Sentry/Logpush
utils.ts                    — cn() 样式合并工具 (shadcn 管理)
query/client.ts             — TanStack QueryClient 工厂 (SSR 安全)
query/provider.tsx          — QueryProvider 客户端组件
query/keys.ts               — queryKeys 缓存键工厂
query/keys.test.ts          — queryKeys 单元测试
validations/workflow.ts     — Zod 工作流表单验证 schema
utils/create-node.ts        — createNode() 节点工厂函数 (生成 UUID + 默认 data)
utils/get-helper-lines.ts   — getHelperLines() 对齐辅助线计算 (5 种对齐关系 + 吸附)
utils/validate-connection.ts — isValidConnection() 连接验证 (禁自连/禁重复/端口类型兼容)
utils/simple-markdown.tsx   — SimpleMarkdown 轻量 Markdown 渲染组件
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
