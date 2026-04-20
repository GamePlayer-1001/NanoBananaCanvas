# Clerk 登录模块嵌入执行清单

> 基于《Clerk 登录系统回装方案与清单.md》与当前匿名主链代码现状整理。
> 目标不是“把 Clerk 装回去”，而是“在匿名可用前提下外挂一个账户系统”。

## 一、现状判断

### 1.1 当前真实运行态

1. `apps/web/middleware.ts` 当前只承担两件事：裸域规范化 + `next-intl` locale 重写。
2. `apps/web/lib/api/auth.ts` 当前通过 `nb_guest_id` cookie 生成匿名访客身份，并把身份镜像写入 `users.clerk_id = anon:{guestId}`。
3. 所有核心 API 基本都依赖 `requireAuth()` / `optionalAuth()`，但它们现在返回的是匿名上下文，而不是第三方登录态。
4. Landing 页主 CTA 当前直接跳 `/workspace`，说明产品主链默认允许匿名进入创作。
5. 账户页 `/[locale]/account` 当前承载的是“匿名账户镜像 + API Key 配置”，不是 Clerk 账户中心。

### 1.2 本次回装的设计边界

1. 不改匿名主链的默认可用性。
2. 不让 `middleware` 再次变成认证、i18n、代理、保护的四合一黑洞。
3. 不让业务层直接消费 Clerk SDK 原始对象。
4. 不以 Clerk 是否可用来决定画板能否打开。

## 二、目标方案

### 2.1 模块分层

1. `identity adapter`
   统一封装 Clerk 的 `auth()`、`currentUser()`、webhook payload 和匿名 cookie 读取。
2. `session facade`
   对外只暴露应用内部 `SessionActor`，提供 `kind`、`actorId`、`isAuthenticated`、`identityKey`。
3. `actor repository`
   负责把匿名 actor、Clerk actor 与 `users` 表做映射，不让业务层碰第三方字段。
4. `auth ui shell`
   负责 `sign-in`、`sign-up`、头像入口、登出按钮、登录回跳。
5. `resource guard`
   只在真正需要账户态的页面/API 上启用，例如“云同步”“跨设备 API Key”“未来的账户作品归档”。

### 2.2 推荐 actor 契约

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
2. `users.clerk_id` 应逐步重命名为更中性的 `identity_key`，但第一阶段可先兼容旧列。
3. 匿名与登录都必须能落到同一个 actor 解析入口。

## 三、路由与跳转方案

### 3.1 新增路由

1. `apps/web/app/[locale]/(auth)/layout.tsx`
   认证路由组布局，纯 UI 壳，不承载业务逻辑。
2. `apps/web/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx`
   Clerk 登录页。
3. `apps/web/app/[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx`
   Clerk 注册页。
4. `apps/web/app/[locale]/(auth)/sso-callback/page.tsx`
   可选，用于将 OAuth 落地后的跳转与 actor 合流集中处理。

### 3.2 页面跳转规则

1. Landing 主 CTA 继续保留“直接进入产品”的匿名路径，目标仍为 `/workspace`。
2. Landing 右上角新增明确的“登录”入口，跳到 `/sign-in?redirect_url=/{locale}/account`。
3. 当用户从需要账户态的能力进入时，统一跳到：
   `/sign-in?redirect_url={encodedCurrentPath}`
4. 登录成功后只允许回跳到站内白名单路径：
   `/account`、`/workspace`、`/workflows`、`/video-analysis`、`/canvas/:id`
5. 退出登录后默认回到 `/explore` 或当前 locale Landing，不回匿名敏感页面。

### 3.3 第一阶段不保护的页面

1. `/explore`
2. `/explore/[id]`
3. `/workspace`
4. `/workspace/[id]`
5. `/canvas/[id]`
6. `/video-analysis`

理由：
当前产品定位仍以匿名可创作为主，登录只解锁额外能力，而不是门禁。

## 四、UI 嵌入方案

### 4.1 Landing 页

1. 保留现有“立即创作”按钮，继续走匿名主链。
2. 在 `landing-nav.tsx` 增加次级按钮“登录”。
3. 如需强调账户价值，只展示轻文案：
   “登录后可同步作品、跨设备读取 API 配置、管理个人资料”。

### 4.2 App Sidebar / Mobile Header

1. 匿名态：
   继续显示当前访客头像 fallback 与免费计划标签。
2. 登录态：
   头像点击进入 `/account`，底部增加“已登录”状态文案或 UserButton 菜单。
3. 不建议第一阶段把 Sidebar 底部完全替换成 Clerk 原生组件。

原因：
当前侧边栏已经和本地账户页结构耦合，直接塞原生组件会破坏现有信息架构。

### 4.3 账户页

1. `/account` 继续保留为应用自有账户中心。
2. `ProfileTab` 中增加 Clerk 用户资料摘要与“前往安全设置 / 登出”入口。
3. `ModelPreferencesTab` 第一阶段改为：
   匿名用户可本地或会话级使用；
   登录用户可开启跨设备云同步。

## 五、服务端嵌入方案

### 5.1 Provider 注入边界

1. 在 `apps/web/app/layout.tsx` 或最小可行共享根布局注入 `ClerkProvider`。
2. 不在每个 route group 单独包 Provider。
3. `ClerkProvider` 只负责 session 与 auth UI，不负责业务初始化。

### 5.2 middleware 处理策略

第一阶段 `middleware.ts` 只新增非常有限的 Clerk 配置：

1. 保持现有 canonical host 逻辑。
2. 保持现有 `next-intl` locale 逻辑。
3. 如 Clerk 代理是生产必需，仅增加代理必要能力，不增加全局 `auth.protect()`。
4. 页面保护改为页面内或 API 内显式守卫，不走全局路由泛拦截。

### 5.3 Session Facade 落点

建议新增：

1. `apps/web/lib/auth/session-actor.ts`
2. `apps/web/lib/auth/identity-adapter.ts`
3. `apps/web/lib/auth/route-guard.ts`
4. `apps/web/lib/auth/redirect.ts`

职责拆分：
1. `identity-adapter.ts` 负责 Clerk 与匿名 cookie 的统一读取。
2. `session-actor.ts` 负责输出业务侧唯一会话对象。
3. `route-guard.ts` 负责 `requireAuthenticatedActor()` 这类细粒度守卫。
4. `redirect.ts` 负责安全回跳与白名单校验。

## 六、数据迁移策略

### 6.1 users 表

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
匿名工作流、文件夹、通知、API 配置、异步任务都已经用匿名 user_id 运行。
如果一上来就自动 merge，会把本次回装复杂度直接推到最高。

建议策略：
1. 新登录用户创建独立 actor。
2. 匿名态历史资源暂不自动迁移。
3. 后续若要迁移，再单独做“导入当前匿名工作区到登录账户”的显式流程。

## 七、执行阶段清单

### Phase 0：预检与准备

- [ ] 确认 `@clerk/nextjs` 与 `@clerk/localizations` 的目标版本
- [ ] 清点当前代码里所有依赖匿名 actor 的 API 与页面
- [ ] 确认第一阶段哪些能力必须登录，哪些继续匿名
- [ ] 确认 Clerk Dashboard 中启用的登录方式（邮箱 / Google / GitHub）
- [ ] 确认生产域名是否仍需 `__clerk` 代理路径

### Phase 1：最小接入

- [ ] 安装 Clerk 依赖
- [ ] 在最小根边界注入 `ClerkProvider`
- [ ] 新建 `(auth)` 路由组与 `sign-in`、`sign-up` 页面
- [ ] 为认证页面补齐中英文案
- [ ] 定义统一 `redirect_url` 白名单策略
- [ ] LandingNav 增加“登录”入口，保留“立即创作”匿名入口

### Phase 2：身份抽象层

- [ ] 新建 `identity adapter`
- [ ] 新建 `session facade`
- [ ] 定义 `SessionActor` / `AuthenticatedActor`
- [ ] 重构 `requireAuth()`，拆成“允许匿名 actor”与“必须登录 actor”两类守卫
- [ ] 将 `/api/users/me` 改为返回标准 actor 视图，而不是“匿名访客特化视图”

### Phase 3：账户页与 UI 合流

- [ ] `AppSidebar` 根据 actor 展示匿名态 / 登录态底部信息
- [ ] `MobileHeader` 补登录入口或账户入口
- [ ] `/account` 接入真实登录资料摘要
- [ ] 增加登出入口
- [ ] 明确匿名用户访问账户同步能力时的登录引导文案

### Phase 4：局部受保护能力

- [ ] 仅对“跨设备同步 API 配置”增加登录要求
- [ ] 仅对“未来云端资源同步”增加登录要求
- [ ] 仅对明确账户资产 API 启用 `requireAuthenticatedActor()`
- [ ] 保持工作区、画布、广场浏览可匿名使用

### Phase 5：Webhook 与账户镜像

- [ ] 新建 `/api/webhooks/clerk`
- [ ] 只处理 `user.created` / `user.updated` / `user.deleted`
- [ ] webhook 只更新账户资料镜像，不触发业务初始化级联
- [ ] 确保 webhook 失败不会阻断登录与产品主链

### Phase 6：收尾与验证

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] 最小登录链路手测：Landing → SignIn → redirect → Account
- [ ] 最小匿名链路手测：Landing → Workspace → Canvas
- [ ] 验证匿名用户不登录时核心产品仍可用
- [ ] 验证登录用户能看到额外账户能力而非被迫改走另一套产品

## 八、文件级落点建议

### 8.1 必改文件

1. `apps/web/app/layout.tsx`
2. `apps/web/middleware.ts`
3. `apps/web/lib/api/auth.ts`
4. `apps/web/app/api/users/me/route.ts`
5. `apps/web/components/layout/landing-nav.tsx`
6. `apps/web/components/layout/app-sidebar.tsx`
7. `apps/web/components/layout/mobile-header.tsx`
8. `apps/web/components/profile/account-content.tsx`
9. `apps/web/messages/en.json`
10. `apps/web/messages/zh.json`

### 8.2 建议新增文件

1. `apps/web/app/[locale]/(auth)/layout.tsx`
2. `apps/web/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx`
3. `apps/web/app/[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx`
4. `apps/web/lib/auth/identity-adapter.ts`
5. `apps/web/lib/auth/session-actor.ts`
6. `apps/web/lib/auth/route-guard.ts`
7. `apps/web/lib/auth/redirect.ts`
8. `apps/web/app/api/webhooks/clerk/route.ts`

## 九、风险清单

1. 最大风险不是 UI，而是 `users.clerk_id` 已被匿名模式挪作兼容身份列。
2. 第二风险是把“登录后可同步”误做成“登录后才能用产品”。
3. 第三风险是把 `middleware` 再次做胖，导致 OpenNext Cloudflare 部署回归。
4. 第四风险是匿名资产与登录资产的自动合并，容易污染现有用户数据边界。

## 十、完成定义

满足以下条件，才算这次 Clerk 回装设计成立：

1. 未登录用户仍可进入工作区和画布主链。
2. 登录页、注册页、登录回跳路径都明确且安全。
3. 业务服务层不直接依赖 Clerk 原始对象。
4. 受保护能力是局部显式的，而不是全局隐式的。
5. 未来继续接“云同步 / webhook / OAuth / 账户资料”时，不需要推翻本次分层。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
