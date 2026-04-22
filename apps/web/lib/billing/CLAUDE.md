# billing/
> L2 | 父级: apps/web/lib/CLAUDE.md

成员清单
config.ts: Stripe 计费配置真相源，集中解析 Secret/Webhook/Portal/Price IDs，提供币种白名单、国家推断与 `resolveStripePriceId()`
config.test.ts: 计费配置单元测试，覆盖币种推断、Price 解析与统一错误码
plans.ts: 套餐权益真相源，统一维护 Standard / Pro / Ultimate 的 monthlyCredits 与 storageGB 镜像
stripe-client.ts: Stripe SDK 门面，负责 secret key 初始化、App URL 校验与 Stripe Customer 绑定
checkout.ts: Checkout 编排层，将登录用户的套餐购买语义翻译成 Stripe Checkout Session

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
