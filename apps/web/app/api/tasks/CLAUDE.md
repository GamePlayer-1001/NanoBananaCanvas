# tasks/
> L2 | 父级: apps/web/app/api/CLAUDE.md

成员清单
route.ts: POST 提交异步任务 / GET 任务列表 / DELETE 批量删除终态生成任务，供账户页“生成作品”管理使用；图片任务提交后会先落 D1 并返回最小 dispatch 指令，再按 `TASK_IMAGE_ORCHESTRATOR` 切到 Cloudflare Workflows 或 legacy Queue，由独立 Worker 真后台执行，避免前台请求同步阻塞；同一 workflow/node 重跑时会优先复用已有活跃任务而不是直接 429；现补充结构化诊断日志，覆盖 submit 请求摘要、dispatch 决策、列表/删除结果与异常出口
[id]/route.ts: GET 单任务状态查询，触发懒评估并返回最新进度与输出；对 workflow 主路会直接观察 Workflow 实例状态，对 legacy queue 的 `pending + no external_task_id` 图片任务只补投递后台队列，不在查询请求里同步执行
[id]/cancel/route.ts: POST 取消任务，处理 Provider best-effort cancel 与平台模式退款

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
