# apps/web/lib/validations/

> L2 | 父级: apps/web/lib/CLAUDE.md

Zod 表单验证 Schema

## 成员清单

```
workflow.ts — createWorkflowSchema / updateWorkflowSchema / publishWorkflowSchema 工作流表单验证
folder.ts   — createFolderSchema / updateFolderSchema 文件夹表单验证 (name 1-50字符)
report.ts   — reportSchema 举报表单验证 (reason enum: spam/nsfw/copyright/other)
explore.ts  — exploreQuerySchema / searchQuerySchema 广场查询验证
ai.ts       — aiExecuteSchema / apiKeySchema / modelsQuerySchema AI 执行验证
upload.ts   — UPLOAD_LIMITS / validateUpload 文件上传校验 (类型+大小)
task.ts     — submitTaskSchema / listTasksSchema 异步任务请求验证 (P2)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
