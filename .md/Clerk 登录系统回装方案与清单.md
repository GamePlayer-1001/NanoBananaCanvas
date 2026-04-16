# Clerk 登录系统回装方案与清单

> 目标：未来重新接入 Clerk 时，不重复当前“认证渗透业务全身”的错误，而是以可插拔边界重新接回。

## 一、回装前提

只有当以下条件成立时，才建议重新安装 Clerk：

1. 核心画板、工作流保存、编辑器交互已经稳定。
2. 已明确“哪些能力必须登录，哪些能力必须匿名可用”。
3. 资源归属模型已经从“临时本地模式”整理为明确的数据边界。
4. 团队确认需要真实账户，而不是继续使用匿名/本地单用户模式。

## 二、目标架构

### 2.1 认证边界

- 登录只负责“身份确认”和“账户态 UI”
- 业务资源访问通过应用内 `actor`/`workspace owner` 抽象，不直接把 Clerk 当业务主模型
- 不再让每个服务函数直接依赖 Clerk SDK

### 2.2 推荐分层

1. `identity adapter`
   职责：封装 Clerk `auth()` / `currentUser()` / webhook 数据映射
2. `session facade`
   职责：向应用提供统一的当前 actor 信息
3. `resource access layer`
   职责：基于 actor 判断工作流/文件夹/任务权限
4. `ui auth shell`
   职责：登录页、头像、登出、受保护页面包装

## 三、明确不要恢复的旧设计

1. 不要再让 `middleware` 同时承担 i18n、canonical host、Clerk 代理、路由保护四种职责。
2. 不要再让 `users.plan` 与第三方身份一起成为业务写入入口。
3. 不要再让路由级 `ClerkProvider` 到处包裹，应该收敛到最小边界。
4. 不要把“自动建用户 + 业务初始化 + 权限判断”塞进同一个函数。

## 四、建议回装顺序

1. 安装依赖并恢复最小 Provider。
2. 只接公开的登录/注册页与基础 session 读取。
3. 接 `identity adapter`，把 Clerk 信息映射到应用内部 actor。
4. 接最小受保护能力，例如“云端工作流同步”。
5. 最后再接头像菜单、Profile、OAuth、webhook 同步。

## 五、回装清单

### 5.1 依赖与配置

- [ ] 安装 `@clerk/nextjs`
- [ ] 安装 `@clerk/localizations`
- [ ] 配置 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] 配置 `CLERK_SECRET_KEY`
- [ ] 配置 `CLERK_WEBHOOK_SECRET`

### 5.2 基础接入

- [ ] 新建最小 `clerk-provider.tsx`
- [ ] 仅在需要 session 的最外层布局注入 Provider
- [ ] 新建 `/sign-in`、`/sign-up` 页面
- [ ] 明确登录成功后的单一回跳路径

### 5.3 身份适配

- [ ] 新建 `identity adapter`，统一封装 Clerk SDK
- [ ] 定义应用内部 `Actor` 类型，不直接在业务层传播 Clerk 原始结构
- [ ] 建立 `users` 镜像策略，但仅作为应用账户档案，不承担全部业务真相

### 5.4 权限接回

- [ ] 先只保护“云同步”与“跨设备资产”
- [ ] 编辑器本地使用仍保持匿名可用
- [ ] 仅在真正需要账户态的 API 上接入守卫

### 5.5 Webhook 与同步

- [ ] 新建最小 webhook 端点
- [ ] 只处理 `user.created` / `user.updated` / `user.deleted`
- [ ] 确保 webhook 失败不会阻断核心产品使用

## 六、验收标准

- [ ] 未登录用户仍可进入核心画板本地模式
- [ ] 登录用户可以看到额外的账户能力，而不是被迫走唯一入口
- [ ] 核心服务层不直接依赖 Clerk SDK
- [ ] 路由保护是局部的、显式的，不是全局泛滥的
- [ ] `pnpm lint` 与 `pnpm test` 通过

## 七、回装时的第一原则

认证应该是外挂，不应该是地基。

如果某次回装让“画板离开 Clerk 就不能活”，那说明设计又走回了旧路，必须立刻停下来重构边界。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
