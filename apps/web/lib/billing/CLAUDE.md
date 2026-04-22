# billing/
> L2 | 父级: apps/web/lib/CLAUDE.md

成员清单
config.ts: Stripe 计费配置真相源，兼容“单 Price 多币种”和“按币种拆 Price”，提供币种白名单、国家推断与 `resolveStripePriceId()`
config.test.ts: 计费配置单元测试，覆盖币种推断、共享 Price 回退、Price 解析与统一错误码
plans.ts: 套餐权益真相源，统一维护 Standard / Pro / Ultimate 的 monthlyCredits 与 storageGB 镜像
stripe-client.ts: Stripe SDK 门面，负责 secret key 初始化、App URL 校验与 Stripe Customer 绑定
checkout.ts: Checkout 编排层，将登录用户的套餐购买语义翻译成 Stripe Checkout Session
portal.ts: Customer Portal 编排层，将登录用户翻译成 Stripe Customer Portal Session
pricing.ts: 公开价格读取层，服务端从 Stripe 拉取套餐价格并整理成 UI 可消费目录
subscription.ts: 订阅镜像层，读取本地 subscriptions 摘要并执行自动月付到期取消
webhook.ts: Stripe Webhook 处理层，负责验签后的幂等落账、续费同步与订阅降级

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
