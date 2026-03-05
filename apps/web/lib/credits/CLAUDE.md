# apps/web/lib/credits/

> L2 | 父级: apps/web/lib/CLAUDE.md

积分系统核心引擎 — 冻结/扣费/退还三阶段事务 + 加密 + 定价

## 成员清单

```
engine.ts  — 积分引擎 (getBalance/freezeCredits/confirmSpend/refundCredits/addCredits/resetMonthlyCredits)
crypto.ts  — 服务端 AES-256-GCM 加解密 (encryptApiKey/decryptApiKey/maskApiKey)
pricing.ts — 模型定价查询 (getModelPricing) + 套餐权限校验 (checkModelAccess)
index.ts   — 聚合导出入口
```

## 设计决策

- 三池余额 (monthly/permanent/frozen)：月费重置和永久积分共存
- 消耗优先级 monthly → permanent：月费积分过期作废，优先消耗
- D1 batch + WHERE balance >= amount：原子性防超扣
- 服务端 AES-256-GCM：与前端 PBKDF2 方案独立，密钥来自 env var

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
