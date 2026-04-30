# agent/
> L2 | 父级: apps/web/app/api/CLAUDE.md

成员清单
plan/route.ts: Agent planner 入口，接收用户目标与 CanvasSummary，输出严格结构化 AgentPlan，并在服务端先做 schema 校验与稳定错误兜底
diagnose/route.ts: Agent diagnose 入口，接收用户问题与 CanvasSummary，返回现象/根因/修复建议结构
explain/route.ts: Agent explain 入口，接收用户问题与 CanvasSummary，返回当前工作流或选中节点的自然语言解释
refine-prompt/route.ts: Prompt refine 入口，接收原始意图/旧 prompt/风格方向，返回新的 PromptConfirmationPayload

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
