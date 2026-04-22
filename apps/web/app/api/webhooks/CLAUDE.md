# webhooks/
> L2 | 父级: apps/web/app/api/CLAUDE.md

成员清单
clerk/route.ts: Clerk Webhook 入口，校验 Svix 签名并把 `user.created/user.updated/user.deleted` 同步到本地 `users` 镜像表。
stripe/route.ts: Stripe Webhook 入口，校验 Stripe 签名并把 Checkout/Invoice/Subscription 事件同步到本地账本。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
