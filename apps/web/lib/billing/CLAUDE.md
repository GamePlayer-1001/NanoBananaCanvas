# billing/
> L2 | 父级: apps/web/lib/CLAUDE.md

成员清单
config.ts: Stripe 计费配置真相源，兼容“单 Price 多币种”“按币种拆 Price”与 `lookup_key` 动态回退，并复用 Worker 友好的 Stripe client 解析 Price ID
config.test.ts: 计费配置单元测试，覆盖币种推断、共享 Price 回退、`lookup_key` 回退、Price 解析与统一错误码
credits.ts: 积分余额读取层，统一汇总双池余额、冻结积分与当前套餐额度镜像，并在用户镜像/生产表缺失时安全降级为 Free
credits.test.ts: 积分读取测试，覆盖余额摘要、历史列漂移、交易流水与 usage 聚合查询口径
schema.ts: 计费 schema 探测层，统一探测 users 与 billing 相关表/列信息，吸收历史库结构漂移
ledger.ts: 积分事务真相源，统一 freeze / confirm / refund 三阶段事务与“订阅池优先、永久池补位”的双池扣减顺序
ledger.test.ts: 积分事务测试，覆盖双池冻结顺序、确认消费、失败退款与 reference 级剩余冻结汇总
metering.ts: 计量真相源，统一模型定价查询、billable units 预估与 credits 预估口径
metering.test.ts: 计量测试，覆盖 model_pricing 查询、文本/图片/视频/音频 billable units 与 credits 换算
plans.ts: 套餐与积分包权益真相源，统一维护 Standard / Pro / Ultimate 与 credit_pack 的本地 snapshot
entitlements.ts: 权益兑现层，统一维护 subscriptions 镜像、membership、月度积分重置、一次性积分发放与 Free 降级
stripe-client.ts: Stripe SDK 门面，统一用 Worker 友好的 fetch httpClient 初始化 Stripe，并负责 App URL 校验与 Stripe Customer 绑定
stripe-client.test.ts: Stripe Customer 绑定兼容测试，覆盖 subscriptions 缺失时受控失败而非制造孤儿 Customer
stripe-error.ts: Stripe 异常映射层，把 Stripe 原生错误统一翻译成 BillingError
stripe-error.test.ts: Stripe 异常映射测试，覆盖支付拒绝、限流、配置拒绝、网络异常与通用异常
checkout.ts: Checkout 编排层，将登录用户的套餐购买语义翻译成 Stripe Checkout Session
portal.ts: Customer Portal 编排层，将登录用户翻译成 Stripe Customer Portal Session
pricing.ts: 公开价格读取层，服务端从 Stripe 拉取套餐与积分包价格并整理成 UI 可消费目录
subscription.ts: 订阅镜像层，读取本地 subscriptions 摘要，在用户镜像缺失时回退 Free，并执行自动月付到期取消
subscription.test.ts: 订阅摘要兼容测试，覆盖 subscriptions 或用户镜像缺失时的 Free 回退口径
webhook.ts: Stripe Webhook 处理层，负责验签后的幂等落账，并调用 entitlements 同步订单对应权益
webhook.test.ts: Stripe Webhook 幂等测试，覆盖重复事件只处理一次与不支持事件安全忽略

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
