# billing/
> L2 | 父级: apps/web/lib/CLAUDE.md

成员清单
config.ts: Stripe 计费配置真相源，兼容“单 Price 多币种”和“按币种拆 Price”，提供币种白名单、国家推断与 `resolveStripePriceId()`
config.test.ts: 计费配置单元测试，覆盖币种推断、共享 Price 回退、Price 解析、缺失元数据与统一错误码
credits.ts: 积分余额读取层，统一汇总双池余额、冻结积分与当前套餐额度镜像
credits.test.ts: 积分读取测试，覆盖余额摘要、交易流水与 usage 聚合查询口径
plans.ts: 套餐与积分包权益真相源，统一维护 Standard / Pro / Ultimate 与 credit_pack 的本地 snapshot
entitlements.ts: 权益兑现层，统一维护 subscriptions 镜像、membership、月度积分重置、一次性积分发放与 Free 降级
stripe-client.ts: Stripe SDK 门面，负责 secret key 初始化、App URL 校验与 Stripe Customer 绑定
stripe-error.ts: Stripe 异常映射层，把 Stripe 原生错误统一翻译成 BillingError
stripe-error.test.ts: Stripe 异常映射测试，覆盖支付拒绝、限流、配置拒绝、网络异常与通用异常
checkout.ts: Checkout 编排层，将登录用户的套餐购买语义翻译成 Stripe Checkout Session
portal.ts: Customer Portal 编排层，将登录用户翻译成 Stripe Customer Portal Session
pricing.ts: 公开价格读取层，服务端从 Stripe 拉取套餐价格并整理成 UI 可消费目录
subscription.ts: 订阅镜像层，读取本地 subscriptions 摘要并执行自动月付到期取消
webhook.ts: Stripe Webhook 处理层，负责验签后的幂等落账，并调用 entitlements 同步订单对应权益
webhook.test.ts: Stripe Webhook 幂等测试，覆盖重复事件只处理一次与不支持事件安全忽略

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
