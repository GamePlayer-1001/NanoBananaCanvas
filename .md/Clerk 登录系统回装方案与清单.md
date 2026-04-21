# Clerk 登录系统统一接入清单

> 本文档是当前项目唯一有效的 Clerk 接入主清单。
> 它整合了原《Clerk 登录系统回装方案与清单.md》与《Clerk 登录模块嵌入执行清单.md》的内容。
> 目标不是“把 Clerk 装回去”，而是“把真实登录能力接回当前产品链路，并与业务身份体系解耦”。

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

### 1.2 当前未完成能力

1. `apps/web/middleware.ts` 虽已接入 Clerk session 注入，但仍未补齐生产代理能力，也未启用任何全局 `auth.protect()` 逻辑。
2. `redirect_url` 的站内白名单策略尚未落地，当前只实现了默认回跳，没有读取查询参数并做站内白名单校验。
3. `AppSidebar`、`/account` 已能消费真实 actor 镜像，但登出入口、独立账户菜单与更明确的登录态文案仍未补齐。
4. 只有“账户级 API 配置”已经切到登录保护；其他未来账户资产 API 仍需继续显式区分匿名态与登录态。
5. Clerk Dashboard 生产域名、回调地址、OAuth 配置、Webhook 真实端点与签名密钥回填仍待核验。

### 1.3 当前阶段判断

当前最准确的阶段描述不是“Clerk 已回装完成”，而是：

`Clerk 认证入口层、最小 webhook 层与基础身份桥接层已接回，资源归属正在从匿名主链切向真实账户态。`

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
5. 当前第一阶段已经稳定实现的是默认回跳 `/workspace`；`redirect_url` 读取、站内白名单校验与安全回跳解析仍待补。
6. 退出登录后默认回到 `/explore` 或当前 locale Landing，不回匿名敏感页面。

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
- [ ] 确认第一阶段哪些能力必须登录，哪些继续匿名
- [ ] 确认 Clerk Dashboard 中启用的登录方式（邮箱 / Google / GitHub）
- [ ] 确认生产域名是否仍需 `__clerk` 代理路径

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
- [ ] 定义统一 `redirect_url` 白名单策略
- [x] 在 `middleware.ts` 中接入 Clerk session 注入并与现有 host/i18n 中间件组合
- [ ] 在 `middleware.ts` 中补齐 Clerk 生产代理能力
- [ ] 核验 Clerk Dashboard 真实环境配置

当前状态：
2026-04-20 已重建新的 Production 实例；本地 `pk/sk` 已切到新实例，但 DNS 解析、Path 配置、真实 Webhook 端点仍未补齐。

### Phase 2：身份抽象层

- [x] 新建 `identity adapter`
- [x] 新建 `session facade`
- [x] 定义 `SessionActor` / `AuthenticatedActor`
- [x] 重构 `requireAuth()`，拆成“允许匿名 actor”与“必须登录 actor”两类守卫
- [x] 将 `/api/users/me` 改为返回标准 actor 视图，而不是匿名访客特化视图

### Phase 3：账户页与 UI 合流

- [x] `AppSidebar` 根据 actor 展示匿名态 / 登录态底部信息
- [x] `MobileHeader` 通过复用 `AppSidebar` 暴露账户入口
- [x] `/account` 接入真实登录资料摘要
- [ ] 增加登出入口
- [x] 明确匿名用户访问账户同步能力时的登录引导文案

### Phase 4：局部受保护能力

- [x] 仅对“跨设备同步 API 配置”增加登录要求
- [ ] 仅对“未来云端资源同步”增加登录要求
- [ ] 仅对明确账户资产 API 启用 `requireAuthenticatedActor()`
- [ ] 保持工作区、画布、广场浏览可匿名使用

### Phase 5：收尾与验证

- [x] `pnpm lint`
- [ ] `pnpm test`
- [ ] 最小登录链路手测：Landing → SignIn → redirect → Account
- [ ] 最小匿名链路手测：Landing → Workspace → Canvas
- [ ] 验证匿名用户不登录时核心产品仍可用
- [ ] 验证登录用户能看到额外账户能力而非被迫改走另一套产品

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

## 十、当前主要风险

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
6. 当前仍未完成的是：Clerk 生产代理 / Dashboard 外围配置、`redirect_url` 白名单解析、登出入口、以及更大范围的账户资产守卫收口。
7. `pnpm --filter @nano-banana/web exec tsc --noEmit` 与 `pnpm --filter @nano-banana/web lint` 已在 2026-04-21 本地通过。
8. `pnpm --filter @nano-banana/web test` 已在 2026-04-21 重新执行，当前仍未通过；失败集中在既有测试断言未跟上当前 schema / 节点默认值，而不是本轮 Clerk 桥接引入的新回归。
9. 当前可明确列出的失败点为：`lib/validations/ai.test.ts` 失败 3 项，`lib/utils/create-node.test.ts` 失败 1 项。
10. 下一步最优先应是：补 `redirect_url` 安全回跳、补登出入口、把更多明确账户资产 API 切到 `requireAuthenticatedActor()`，最后完成 Dashboard 代理与真实 webhook 端点配置。

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
