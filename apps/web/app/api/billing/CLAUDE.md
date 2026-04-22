# billing/
> L2 | 父级: apps/web/app/api/CLAUDE.md

成员清单
checkout/route.ts — POST Stripe Checkout Session 创建入口，要求登录态，按 purchaseMode + IP/currency 解析生成结账链接
portal/route.ts — POST Stripe Customer Portal Session 创建入口，要求登录态并返回订阅管理链接
subscription/route.ts — GET 当前登录用户的订阅镜像摘要，供账户页与未来 /billing 页消费
cancel/route.ts — POST 自动月付到期取消入口，要求登录态并标记 cancel_at_period_end

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
