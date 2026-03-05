# apps/web/db/

> L2 | 父级: apps/web/CLAUDE.md

D1 数据库 Schema 与种子数据

## 成员清单

```
schema.sql       — D1 完整 Schema (14 表 + 索引: M8 基础 7 表 + M7 积分/支付 7 表)
seed.sql         — 分类种子数据 (8 个 AI 工作流分类，双语 name_en/name_zh)
seed-pricing.sql — 模型定价 (19 模型) + 积分包 (4 档) 种子数据
```

## 设计决策

- Raw D1 SQL (不用 Drizzle/Prisma)：D1 是 SQLite，直接 prepare/bind 最透明
- 反范式 like_count/clone_count：避免广场列表 COUNT JOIN
- 复合主键 likes/favorites：天然去重

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
