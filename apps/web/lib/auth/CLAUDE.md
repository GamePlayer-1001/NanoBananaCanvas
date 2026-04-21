# auth/
> L2 | 父级: apps/web/lib/CLAUDE.md

成员清单
identity-adapter.ts: 身份来源适配层，统一解析 Clerk 会话与匿名 cookie，输出中性身份描述。
session-actor.ts: 会话 actor 门面层，把身份源映射到 `users` 表，输出业务可消费的 `SessionActor` / `AuthenticatedActor`。

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
