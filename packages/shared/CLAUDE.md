# packages/shared/

> L2 | 父级: /CLAUDE.md

共享类型、常量、工具函数 · 被 web 和 worker 消费

## 成员清单

```
src/index.ts           — 桶文件，重导出 types + constants + utils
src/types/index.ts     — TaskStatus/ModelCategory/ExecutionMode/TaskQueueMessage 等共享类型
src/constants/index.ts — TASK_CONFIG/LOCALES 等共享常量
src/utils/index.ts     — 工具函数桶文件
src/utils/nanoid.ts    — 零依赖 nanoid 生成器 (Web Crypto API)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
