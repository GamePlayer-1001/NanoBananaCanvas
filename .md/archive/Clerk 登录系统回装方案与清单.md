# Clerk 登录系统统一接入清单

> 本文档是当前项目唯一有效的 Clerk 接入主清单。
> 它整合了原《Clerk 登录系统回装方案与清单.md》与《Clerk 登录模块嵌入执行清单.md》的内容。
> 目标不是“把 Clerk 装回去”，而是“把真实登录能力接回当前产品链路，并与业务身份体系解耦”。

## 零、结案结论

### 0.1 当前文档是否已闭环

结论：
`代码接入主链已闭环，文档已进入结案态；剩余事项已被明确拆分为“人工环境配置”与“下一阶段能力”，不再算作本轮 Clerk 接入阻塞项。`

### 0.2 本轮已正式结案的范围

1. Clerk 登录入口、Provider 注入、登录页/注册页、默认回跳、登出入口。
2. `SessionActor` 身份桥接、`users` 表账户镜像、`/api/users/me`、Clerk webhook 最小同步。
3. 账户页与侧边栏登录态 UI、账户级 API Key 登录保护、资源按 `user_id` 归属，工作流生成结果已统一进入账户级私有留存。
4. 本地匿名草稿检测与显式导入正式账户工作区。
5. 清单文档、模块 CLAUDE 文档、文件头契约同步完成。

### 0.3 不再归入“本轮未完成”的事项

以下内容仍然存在，但不再定义为“本轮 Clerk 接入未做完”，而是转入后续两类：

1. 人工环境配置：
   Clerk Dashboard 生产域名、回调地址、OAuth 开关、Webhook 真实端点、签名密钥、`__clerk` 代理路径已于 2026-04-21 完成核对。
2. 下一阶段能力：
   跨设备匿名资产迁移、复杂资源合并、完整会员体系、更多账户资产 API 的分层收口。

## 一、当前真实进度

### 1.1 已落地能力

1. `@clerk/nextjs@^7.2.3` 与 `@clerk/localizations@^4.5.2` 已重新接回项目。
2. `apps/web/app/[locale]/layout.tsx` 已注入 `ClerkProvider`，并按 locale 接入中文本地化。
3. `apps/web/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx` 已落地，内部使用真实 Clerk `SignIn` 卡片。
4. `apps/web/app/[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx` 已落地，内部使用真实 Clerk `SignUp` 卡片。
5. Landing Page 当前不保留单独“登录”按钮，主 CTA“立即创作”已经跳转到 `/sign-in`。
6. 登录成功后的默认回跳已经固定到 `/${locale}/workspace`；`[locale]/layout.tsx` 提供 Provider 级 fallback redirect，`sign-in` / `sign-up` 页面额外通过 `forceRedirectUrl` 与 `fallbackRedirectUrl` 固定页面级回跳。
7. 站点当前使用隐藏语言前缀策略，外部 URL 不暴露 `/zh`、`/en` 前缀。
8. `apps/web/app/api/webhooks/clerk/route.ts` 已存在，并处理 `user.created` / `user.updated` / `user.deleted` 三类最小同步事件。
9. `apps/web/middleware.ts` 已接入 Clerk session 注入，并与现有裸域规范化、`next-intl` 重写组合运行；当前仍未启用全局 `auth.protect()`。
10. `apps/web/lib/auth/identity-adapter.ts`、`apps/web/lib/auth/session-actor.ts` 已落地，`apps/web/lib/api/auth.ts` 已改为统一输出 `SessionActor` 兼容视图。
11. `apps/web/app/api/users/me/route.ts` 已返回标准 actor 视图，账户页与侧边栏已可消费真实登录账户镜像。
12. `/api/settings/api-keys*` 已要求登录后访问，账户级 API 配置不再写入匿名访客上下文。
13. `apps/web/lib/auth/redirect.ts` 已落地，`sign-in` / `sign-up` 已支持读取 `redirect_url`，并限制回跳到站内白名单路径。
14. `AppSidebar` 与 `/account` 资料页已补齐登录态 / 匿名态文案与登出入口；登出后默认回到 `/${locale}` Landing。
15. `users` 表已扩展 `username`、`first_name`、`last_name`、`membership_status` 字段，Clerk session / webhook / `/api/users/me` / 账户页展示已完成同构更新。
16. `/account` -> “我的作品” 已支持检测当前设备本地草稿，并在登录后显式导入到账户工作区，避免匿名创作结果继续滞留在单机 `localStorage`。
17. `apps/web/middleware.ts` 与 `apps/web/app/[locale]/layout.tsx` 已补齐 Clerk Frontend API 代理代码入口；当 `NEXT_PUBLIC_CLERK_PROXY_URL` 存在时，可直接启用代理路径。
18. 工作流异步任务完成后的图片 / 视频 / 音频结果已统一写入 R2 `outputs/{userId}/{taskId}.{ext}`，并通过 `/api/files/...` 按账户私有读取，避免用户之间串读生成媒体。

### 1.2 剩余事项归类

#### A. 人工环境配置

1. `apps/web/middleware.ts` 已完成代码侧 Clerk session 注入与 Frontend API 代理能力；生产环境配置已完成核对。
2. Clerk Dashboard 生产域名、回调地址、OAuth 配置、Webhook 真实端点与签名密钥已完成核对。
3. `__clerk` 代理路径是否启用已完成部署决策核对，不再作为本轮待办。

#### B. 下一阶段能力

1. 当前白名单已覆盖现阶段账户入口；若未来新增账户态页面，需同步更新 `apps/web/lib/auth/redirect.ts`。
2. 只有“账户级 API 配置”已经切到登录保护；其他未来账户资产 API 仍需按业务边界继续显式区分匿名态与登录态。
3. “用户生成资源绑定”、“工作流生成结果账户级留存”和“用户账户数据库完善”已经完成本轮目标；剩余的是更深层的会员体系、跨设备历史匿名资产迁移工具与更复杂的数据合并策略。

### 1.3 当前阶段判断

当前最准确的阶段描述是：

`Clerk 接入主链已完成收口，产品已经具备真实登录、账户镜像、资源归属隔离与本地草稿导入账户的闭环能力。`

## 二、设计边界

1. 不把 Clerk 反向渗透成业务单一真相源。
2. 不让 `middleware` 再次变成认证、i18n、代理、保护的四合一黑洞。
3. 不让业务层直接消费 Clerk SDK 原始对象。
4. 不以 Clerk 是否可用来决定画板能否打开。
5. 认证应该是外挂，不应该是地基。

## 三、目标架构

### 3.1 认证边界

1. 登录只负责“身份确认”和“账户态 UI”。
2. 业务资源访问通过应用内 `actor` / `workspace owner` 抽象，不直接把 Clerk 当业务主模型。
3. 不再让每个服务函数直接依赖 Clerk SDK。

### 3.2 推荐分层

1. `identity adapter`
   职责：统一封装 Clerk 的 `auth()`、`currentUser()`、webhook payload 和匿名 cookie 读取。
2. `session facade`
   职责：向应用对外暴露唯一会话对象。
3. `actor repository`
   职责：把匿名 actor、Clerk actor 与 `users` 表做映射，不让业务层碰第三方字段。
4. `auth ui shell`
   职责：承载 `sign-in`、`sign-up`、头像入口、登出按钮、登录回跳。
5. `resource guard`
   职责：仅在真正需要账户态的页面/API 上启用显式守卫。

### 3.3 推荐 actor 契约

```ts
type SessionActor =
  | {
      kind: 'anonymous'
      actorId: string
      identityKey: `anon:${string}`
      isAuthenticated: false
    }
  | {
      kind: 'clerk'
      actorId: string
      identityKey: `clerk:${string}`
      isAuthenticated: true
      clerkUserId: string
    }
```

设计原则：
1. 业务层只认 `SessionActor`。
2. `users.clerk_id` 第一阶段继续作为兼容身份列使用，后续再迁移到更中性的 `identity_key`。
3. 匿名与登录都必须落到同一个 actor 解析入口。

## 四、路由与跳转策略

### 4.1 认证路由

1. `apps/web/app/[locale]/(auth)/layout.tsx`
2. `apps/web/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx`
3. `apps/web/app/[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx`
4. `apps/web/app/[locale]/(auth)/sso-callback/page.tsx`
   可选，后续 OAuth 合流时再补。

### 4.2 页面跳转规则

1. Landing 主 CTA 直接进入 `/sign-in`。
2. Landing 当前不新增独立“登录”按钮，避免双入口并存造成认知噪音。
3. 当用户从需要账户态的能力进入时，目标策略仍是统一跳到：
   `/sign-in?redirect_url={encodedCurrentPath}`
4. 登录成功后只允许回跳到站内白名单路径：
   `/account`、`/workspace`、`/workflows`、`/video-analysis`、`/canvas/:id`
5. 当前第一阶段已经实现 `redirect_url` 读取与站内白名单校验；未命中白名单时统一回退到 `/workspace`。
6. 退出登录后默认回到当前 locale Landing，不回匿名敏感页面。

### 4.3 第一阶段保持匿名可用的页面

1. `/explore`
2. `/explore/[id]`
3. `/workspace`
4. `/workspace/[id]`
5. `/canvas/[id]`
6. `/video-analysis`

原因：
当前产品定位仍以匿名可创作为主，登录只解锁额外能力，而不是门禁。

## 五、服务端接入策略

### 5.1 Provider 注入边界

1. 在最小共享根布局注入 `ClerkProvider`。
2. 不在每个 route group 单独包 Provider。
3. `ClerkProvider` 只负责 session 与 auth UI，不负责业务初始化。

### 5.2 middleware 策略

第一阶段 `middleware.ts` 只允许承担非常有限的 Clerk 职责：

1. 保持现有 canonical host 逻辑。
2. 保持现有 `next-intl` locale 逻辑。
3. 如 Clerk 代理是生产必需，仅增加代理必要能力，不增加全局 `auth.protect()`。
4. 页面保护改为页面内或 API 内显式守卫，不走全局路由泛拦截。

### 5.3 建议新增身份模块

1. `apps/web/lib/auth/identity-adapter.ts`
2. `apps/web/lib/auth/session-actor.ts`
3. `apps/web/lib/auth/route-guard.ts`
4. `apps/web/lib/auth/redirect.ts`

职责拆分：
1. `identity-adapter.ts` 负责 Clerk 与匿名 cookie 的统一读取。
2. `session-actor.ts` 负责输出业务侧唯一会话对象。
3. `route-guard.ts` 负责 `requireAuthenticatedActor()` 这类细粒度守卫。
4. `redirect.ts` 负责安全回跳与白名单校验。

## 六、数据迁移策略

### 6.1 users 表身份列

当前 `users.clerk_id` 已经被匿名身份复用，不能直接恢复“只存 Clerk user id”的旧语义。

建议分两阶段：

1. Phase A，兼容期
   继续使用 `clerk_id` 列，但写入更中性的 identity key：
   `anon:{guestId}` / `clerk:{clerkUserId}`
2. Phase B，收口期
   增加 `identity_key` 列，完成代码切换后废弃 `clerk_id`

### 6.2 匿名升级为登录用户

第一阶段推荐不做自动资源合并，只做账户建立与新资源归属。

原因：
匿名工作流、文件夹、通知、API 配置、异步任务都已经用匿名 `user_id` 运行。
如果一上来就自动 merge，会把本次接桥复杂度直接推到最高。

建议策略：
1. 新登录用户创建独立 actor。
2. 匿名态历史资源暂不自动迁移。
3. 后续若要迁移，再单独做“导入当前匿名工作区到登录账户”的显式流程。

## 七、统一执行清单

### Phase 0：预检与准备

- [x] 确认 `@clerk/nextjs@^7.2.3` 与 `@clerk/localizations@^4.5.2` 的目标版本
- [x] 清点当前代码里所有依赖匿名 actor 的 API 与页面
- [x] 确认第一阶段哪些能力必须登录，哪些继续匿名
- [x] 确认 Clerk Dashboard 中启用的登录方式（邮箱 / Google / GitHub）
- [x] 确认生产域名是否仍需 `__clerk` 代理路径

说明：
第一阶段边界已经在代码中落实为“核心创作继续匿名可用，账户级配置与正式账户资产走登录态”。

### Phase 1：最小接入

- [x] 安装 Clerk 依赖
- [x] 在最小根边界注入 `ClerkProvider`
- [x] 新建 `(auth)` 路由组与 `sign-in`、`sign-up` 页面
- [x] 为认证页面补齐中英文案
- [x] 调整 Landing 主 CTA 进入登录页
- [x] 新建 `/api/webhooks/clerk`
- [x] 只处理 `user.created` / `user.updated` / `user.deleted`
- [x] webhook 只更新账户资料镜像，不触发业务初始化级联
- [x] 确保 webhook 失败不会阻断登录与产品主链
- [x] 定义统一 `redirect_url` 白名单策略
- [x] 在 `middleware.ts` 中接入 Clerk session 注入并与现有 host/i18n 中间件组合
- [x] 在 `middleware.ts` 中补齐 Clerk 生产代理能力
- [x] 核验 Clerk Dashboard 真实环境配置

当前状态：
2026-04-20 已重建新的 Production 实例；截至 2026-04-21，Dashboard 生产域名、Path、真实 Webhook 端点与代理策略已完成核对。

结论：
环境接入与部署核验已完成，不再存在 Clerk 接入主链的环境阻塞项。

### Phase 2：身份抽象层

- [x] 新建 `identity adapter`
- [x] 新建 `session facade`
- [x] 定义 `SessionActor` / `AuthenticatedActor`
- [x] 重构 `requireAuth()`，拆成“允许匿名 actor”与“必须登录 actor”两类守卫
- [x] 将 `/api/users/me` 改为返回标准 actor 视图，而不是匿名访客特化视图
- [x] 扩展 `users` 表账户资料字段（昵称 / 姓 / 名 / 会员状态）并同步 Clerk 镜像

### Phase 3：账户页与 UI 合流

- [x] `AppSidebar` 根据 actor 展示匿名态 / 登录态底部信息
- [x] `MobileHeader` 通过复用 `AppSidebar` 暴露账户入口
- [x] `/account` 接入真实登录资料摘要
- [x] 增加登出入口
- [x] 明确匿名用户访问账户同步能力时的登录引导文案

### Phase 4：局部受保护能力

- [x] 仅对“跨设备同步 API 配置”增加登录要求
- [x] 抽出 `requireAccountActor()` 语义化账户守卫别名，作为后续账户资产 API 的统一入口
- [x] 提供“本地草稿导入正式账户”显式流程，避免匿名作品继续滞留单机
- [x] 工作流生成结果统一持久化到 `outputs/{userId}/{taskId}.{ext}`，并通过 `/api/files/...` 做账户级私有访问
- [x] 对明确账户资产 API 启用登录守卫：`/api/settings/api-keys*`、`/api/files/uploads/*`、`/api/files/outputs/*`
- [x] 保持工作区、画布、广场浏览可匿名使用

### Phase 5：收尾与验证

- [x] `pnpm lint`
- [x] `pnpm test`
- [ ] 最小登录链路手测：Landing → SignIn → redirect → Account
- [ ] 最小匿名链路手测：Landing → Workspace → Canvas
- [ ] 验证匿名用户不登录时核心产品仍可用
- [ ] 验证登录用户能看到额外账户能力而非被迫改走另一套产品

说明：
`pnpm --filter @nano-banana/web exec tsc --noEmit`、`pnpm --filter @nano-banana/web lint`、`pnpm --filter @nano-banana/web test` 已于 2026-04-21 按本轮最新代码重新本地通过；手测项当前仅作为上线前人工验收清单保留。

## 八、文件级落点

### 8.1 必改文件

1. `apps/web/middleware.ts`
2. `apps/web/lib/api/auth.ts`
3. `apps/web/app/api/users/me/route.ts`
4. `apps/web/components/layout/app-sidebar.tsx`
5. `apps/web/components/layout/mobile-header.tsx`
6. `apps/web/components/profile/account-content.tsx`
7. `apps/web/messages/en.json`
8. `apps/web/messages/zh.json`

### 8.2 建议新增文件

1. `apps/web/lib/auth/identity-adapter.ts`
2. `apps/web/lib/auth/session-actor.ts`
3. `apps/web/lib/auth/route-guard.ts`
4. `apps/web/lib/auth/redirect.ts`

## 九、验收标准

1. 未登录用户仍可进入核心画板本地模式。
2. Landing 主入口稳定进入登录页。
3. 登录用户可以看到额外的账户能力，而不是只有“登录成功”但没有业务账户态。
4. 核心服务层不直接依赖 Clerk SDK。
5. 路由保护是局部的、显式的，不是全局泛滥的。
6. `pnpm lint` 通过。
7. `pnpm test` 通过，或明确记录失败与原因。

## 十、剩余风险

1. 最大风险不是 UI，而是 `users.clerk_id` 已被匿名模式挪作兼容身份列。
2. 第二风险是把“登录后可同步”误做成“登录后才能用产品”。
3. 第三风险是把 `middleware` 再次做胖，导致 OpenNext Cloudflare 部署回归。
4. 第四风险是匿名资产与登录资产的自动合并，容易污染现有用户数据边界。

## 十一、本轮代码审计结论（2026-04-21）

1. 已完成的是 UI 入口、Provider 注入、语言本地化、默认回跳、`/api/webhooks/clerk` 最小镜像同步，以及 `SessionActor -> users -> 资源 user_id` 这条基础桥接链路。
2. `apps/web/middleware.ts` 已接入 Clerk session 注入，`apps/web/lib/auth/identity-adapter.ts` 与 `apps/web/lib/auth/session-actor.ts` 已落地，`apps/web/lib/api/auth.ts` 已不再固定返回匿名访客。
3. `apps/web/app/api/users/me/route.ts`、`apps/web/hooks/use-user.ts`、`/account`、`AppSidebar` 已能消费真实账户镜像，登录用户的资料与资源开始落到正式 actor。
4. `users.clerk_id` 继续承担兼容身份键角色，匿名链路写入 `anon:{guestId}`，登录链路与 webhook 链路写入 `clerk:{clerkUserId}`；在真正迁移列名之前，不应把它重新当成“只存 Clerk user id”的字段。
5. 账户级 API 配置已经改为登录保护，匿名访客不再把这类跨设备资产写入 guest actor。
6. 工作流生成结果现在会在任务完成时统一写入 R2 `outputs/{userId}/{taskId}.{ext}`，数据库只保留站内私有访问地址与 `r2_key`，用户只能读取自己的生成媒体。
7. 当前未纳入本轮结案范围的是：会员体系、跨设备匿名资产迁移、复杂资源合并这些“账户体系深化”能力。
8. `pnpm --filter @nano-banana/web exec tsc --noEmit`、`pnpm --filter @nano-banana/web lint`、`pnpm --filter @nano-banana/web test` 已于 2026-04-21 按本轮最新代码重新全部通过。
9. 当前代码侧已不存在 Clerk 接入主链的结构性遗留项，Dashboard / 域名 / Webhook 配置也已完成核对。
10. 若进入下一阶段，最优先应是：设计“我的作品/历史生成结果”检索与展示页，再决定是否补充更长保留期、收藏夹和会员体系。

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
