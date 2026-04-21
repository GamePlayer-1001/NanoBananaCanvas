# billing/
> L2 | 父级: apps/web/lib/CLAUDE.md

成员清单
config.ts: Stripe 计费配置真相源，集中解析 Secret/Webhook/Portal/Price IDs，提供币种白名单、国家推断与 `resolveStripePriceId()`
config.test.ts: 计费配置单元测试，覆盖币种推断、Price 解析与统一错误码

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
