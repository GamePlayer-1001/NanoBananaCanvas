# apps/web/services/storage/

> L2 | 父级: apps/web/services/CLAUDE.md

工作流持久化服务 — 序列化 + localStorage + 文件导入导出

## 成员清单

```
index.ts          — 聚合导出存储服务公共 API
serializer.ts     — 工作流 JSON 序列化/反序列化 (version 1 格式，剥离运行时状态)
local-storage.ts  — localStorage 读写 (nb-workflow key)
export-import.ts  — JSON 文件下载导出 / 文件选择器导入
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
