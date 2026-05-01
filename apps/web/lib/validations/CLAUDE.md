# apps/web/lib/validations/

> L2 | 父级: apps/web/lib/CLAUDE.md

Zod 表单验证 Schema

## 成员清单

```
workflow.ts — createWorkflowSchema / updateWorkflowSchema / publishWorkflowSchema 工作流表单验证 (含创建 folderId、导入本地草稿、模板元数据与审计轨迹载荷)
folder.ts   — createFolderSchema / updateFolderSchema 文件夹表单验证 (name 1-50字符)
report.ts   — reportSchema 举报表单验证 (reason enum: spam/nsfw/copyright/other)
explore.ts  — exploreQuerySchema / exploreTypeSchema / searchQuerySchema 广场查询验证
ai.ts       — aiExecuteSchema / apiKeySchema / modelsQuerySchema AI 执行验证 (含平台模型能力校验，防止图片/视频/音频模型串用)
agent.ts    — agentPlanRequestSchema / agentPlanResponseSchema / agentPlanSchema Agent 提案/诊断/优化链路结构化验证 (含模板上下文、优化信号与助手运行时选择)
billing.ts  — checkoutSchema / topupSchema Stripe 结账请求验证 (plan/packageId + currency)
upload.ts   — SHARE_UPLOAD_ACCEPT / UPLOAD_LIMITS / detectUploadKind / validateUpload 文件上传校验 (图片/视频/工作流)
task.ts     — submitTaskSchema / listTasksSchema / deleteTasksSchema 异步任务请求验证 (P2)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
