# ai/
> L2 | 父级: apps/web/app/api/CLAUDE.md

成员清单
models/route.ts: 公开 AI 模型目录入口，优先读 D1 `ai_models`，若表缺失/查询炸裂则降级到平台运行时目录，并继续支持 text/image/video/audio 分类过滤，作为平台模式节点的单一模型真相源
execute/route.ts: 非流式 AI 执行入口，平台模式先解析“平台模型 -> 内部供应商 API”再执行并接回预冻结/确认/失败退款，user_key 模式只记 usage log
execute/route.test.ts: 非流式 AI 执行路由回归测试，覆盖平台模式冻结结算与失败退款编排
stream/route.ts: SSE 流式 AI 执行入口，平台模式先解析“平台模型 -> 内部供应商 API”再执行并接回预冻结/完成后确认/失败退款，user_key 模式只记 usage log

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
