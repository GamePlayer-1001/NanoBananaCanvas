# apps/web/lib/credits/

> L2 | 父级: apps/web/lib/CLAUDE.md

积分系统核心引擎 — 冻结/扣费/退还三阶段事务 + 加密 + 定价

## 成员清单

```
types.ts   — CreditBalance 接口、Pool 类型、FREEZE_TTL_MINUTES 常量
query.ts   — 余额查询 (getBalance) + 超时冻结清理 (unfreezeStaleCredits)
freeze.ts  — 三阶段事务引擎 (freezeCredits/confirmSpend/refundCredits)
topup.ts   — 充值操作 (addCredits/resetMonthlyCredits)，被 Stripe webhook 消费
crypto.ts  — 服务端 AES-256-GCM 加解密 (encryptApiKey/decryptApiKey/maskApiKey)
pricing.ts — 模型定价查询 (getModelPricing) + 套餐权限校验 (checkModelAccess)
index.ts   — 聚合导出入口
```

## 设计决策

- 三池余额 (monthly/permanent/frozen)：月费重置和永久积分共存
- 消耗优先级 monthly → permanent：月费积分过期作废，优先消耗
- D1 batch + WHERE balance >= amount：原子性防超扣
- 冻结超时清理 (5min TTL)：getBalance 时被动触发 unfreezeStaleCredits，防积分永久卡死
- 服务端 AES-256-GCM：与前端 PBKDF2 方案独立，密钥来自 env var
- 文件拆分：query(余额) → freeze(事务) → topup(充值) 单向依赖，无循环

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
