# apps/web/lib/credits/

> L2 | 父级: apps/web/lib/CLAUDE.md

历史商业化工具层 — API Key 加密仍在用，其余积分/定价逻辑待后续拆除

## 成员清单

```
types.ts   — 历史积分余额类型与常量，当前主要供遗留代码与测试保留
query.ts   — 历史余额查询与冻结清理工具，待后续数据库层清扫
freeze.ts  — 历史冻结/扣费/退还事务引擎，已脱离主执行链
topup.ts   — 历史充值/月度重置工具，Stripe 移除后待清理
crypto.ts  — 服务端 AES-256-GCM 加解密 (encryptApiKey/decryptApiKey/maskApiKey)
pricing.ts — 历史模型定价查询与套餐权限校验，已脱离主执行链
index.ts   — 聚合导出入口，当前主要保留 crypto 的兼容访问
```

## 设计决策

- 当前策略: 运行时主链已不再依赖积分/套餐/Stripe，目录转为历史兼容层
- 服务端 AES-256-GCM：与前端 PBKDF2 方案独立，密钥来自 env var
- 文件拆分：crypto 为现役能力，其余文件保留待数据库与测试清扫

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
