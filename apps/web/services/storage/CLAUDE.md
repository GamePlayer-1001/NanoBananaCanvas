# apps/web/services/storage/

> L2 | 父级: apps/web/services/CLAUDE.md

工作流持久化服务 — 序列化 + localStorage + 文件导入导出

## 成员清单

```
index.ts          — 聚合导出存储服务公共 API
serializer.ts     — 工作流 JSON 序列化/反序列化 (version 1 格式，剥离运行态 status/taskId/progress，并保留最终结果字段与模板元数据)
serializer.test.ts — serializer 回归测试 (验证异步任务运行态不会持久化，最终 resultUrl 仍可保存)
local-storage.ts  — localStorage 读写 (nb-workflow key)
export-import.ts  — JSON 文件下载导出 / 文件选择器导入
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
