# execute/
> L2 | 父级: apps/web/app/api/ai/CLAUDE.md

成员清单
route.ts: POST 非流式 AI 执行入口，平台模式执行 `freeze -> provider.chat -> confirm/refund`，user_key 模式仅记录 usage
route.test.ts: 非流式 AI 执行路由测试，验证平台模式计费编排、超额冻结补差与失败退款

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
