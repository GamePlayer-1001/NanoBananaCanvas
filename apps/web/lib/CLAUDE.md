# apps/web/lib/

> L2 | 父级: apps/web/CLAUDE.md

工具函数与配置

## 成员清单

```
errors.ts    — AppError 统一错误类型体系 (NetworkError/AuthError/AIServiceError/WorkflowError)
logger.ts    — 轻量级日志工具 (开发彩色终端/生产结构化 JSON)
utils.ts     — cn() 样式合并工具 (shadcn 管理)
query/       — TanStack Query 配置与缓存键工厂 (4 文件，详见子 CLAUDE.md)
utils/       — 画布与节点通用工具函数 (4 文件，详见子 CLAUDE.md)
validations/ — Zod 表单验证 Schema (1 文件，详见子 CLAUDE.md)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
