# Stripe 支付系统嵌入执行清单

> 目标：基于《archive/积分与支付系统架构设计.md》的 v3.0 主方案，将 Stripe 支付系统重新嵌入当前项目运行时。
> 主口径：`Free` 为默认进入态；付费体系采用 `Standard / Pro / Ultimate` 三档收费套餐 + 积分包补充；执行模式保留 `credits / user_key` 双模式。
> 范围：本清单只覆盖 Stripe 支付系统重建，不覆盖支付宝 / 微信支付。

---

## 一、设计前提

1. `Free` 不进入 Stripe Checkout，只在本地账户体系中表达默认态。
2. 套餐只影响两类权益：`积分额度`、`存储空间`。
3. 付费链路分为三类订单：
   - 自动月付套餐 `plan_auto_monthly`
   - 一次性套餐 `plan_one_time`
   - 积分包购买 `credit_pack`
4. 所有价格决策由服务端完成，客户端只传业务语义参数。
5. 生产部署目标仍是 Cloudflare Workers + D1 + R2 + GitHub Actions。

---

## 二、阶段任务

状态说明：
- `[x]` 已完成并已在当前代码/配置中落地
- `[ ]` 尚未开始或尚未形成可验证闭环
- `[~]` 已部分完成，但仍有剩余人工配置、边界收口或非阻塞尾项待补

### Phase 0：预检与对齐

- [x] **SPAY-000** 确认当前代码树中已删除的旧商业化残留边界，列出需要复活的目录与文件
- [x] **SPAY-001** 对齐支付主方案：`Free 默认进入态 + 四档套餐 + 积分包 + token 计费`
- [x] **SPAY-002** 确认套餐权益只保留 `monthlyCredits` 与 `storageGB`
- [x] **SPAY-003** 明确登录前后支付边界：未登录用户只能浏览定价页，结账必须登录
- [x] **SPAY-004** 明确币种白名单与 IP 推断策略，确定默认币种回退规则

#### Phase 0 结论（2026-04-21）

1. **旧商业化运行时已被真实移除**
   - `apps/web/db/schema.sql` 已删除 `credit_balances / credit_transactions / subscriptions / processed_stripe_events`。
   - `apps/web/app/api/CLAUDE.md` 已明确写明“商业化：计费与 Stripe 入口已移除”。
   - `apps/web/components/pricing/` 当前只剩 `CLAUDE.md` 壳文件，真实定价组件已清空。
   - 代码树中已不存在 `app/api/billing/*`、`app/api/credits/*`、`app/api/webhooks/stripe/route.ts`、`/pricing` 页面运行时文件。
   - 当前仅残留少量“免费版”文案与账户页 `membershipStatus` 展示位，不构成支付链路。
2. **需要复活的目录与文件边界**
   - 路由页：`apps/web/app/[locale]/(landing)/pricing/page.tsx`、`apps/web/app/[locale]/(app)/billing/page.tsx`
   - API：`apps/web/app/api/billing/*`、`apps/web/app/api/credits/*`、`apps/web/app/api/pricing/plans/route.ts`、`apps/web/app/api/webhooks/stripe/route.ts`
   - 服务层：`apps/web/lib/billing/*` 或 `apps/web/lib/stripe/*`（以配置、checkout、portal、webhook、账本服务拆分）
   - UI：`apps/web/components/pricing/*`、`apps/web/components/billing/*`
   - 数据层：`apps/web/db/schema.sql` 与对应 migration/seed，重建 billing 账本与 Stripe 幂等表
3. **统一主方案锁定**
   - 唯一口径：`Free 默认进入态 + Standard / Pro / Ultimate + credit_pack + token 计费`
   - 不再回退到历史 `Free + Pro` 二档实验版，也不恢复“固定每次调用积分”的旧口径。
4. **套餐权益锁定**
   - 套餐仅承载两类权益：`monthlyCredits` 与 `storageGB`
   - 并发数、模型访问层级、功能开关不再绑在套餐上，避免把产品能力切成大量例外分支。
5. **登录前后支付边界锁定**
   - 未登录用户：允许访问与浏览 `/pricing`
   - 发起 Checkout / Portal / Cancel / Topup：必须先登录并获得真实 `SessionActor`
   - `Free` 不是 Stripe SKU，不进入 Checkout；它只在本地账户系统中表达默认态。
6. **首批币种与推断策略锁定**
   - 手动固定币种只保留：`usd / cny`
   - 服务端依据 `CF-IPCountry` 推断 integration currency：`CN -> cny`，其他地区统一回退 `usd`
   - `usd / cny` 之外的地区不再手动维护固定 Price，默认交给 Stripe Adaptive Pricing 在 Checkout 托管页自动本地化
   - 客户端只允许请求 `usd / cny` 两种固定币种，最终 Price ID 仍由服务端解析，不信任任意客户端价格参数

### Phase 1：Stripe Dashboard 建模

- [x] **SPAY-100** 在 Stripe Dashboard 建立付费套餐商品模型（当前为 `Nano Banana Canvas Bundle` 单 Product + 三个套餐 Price）
- [x] **SPAY-101** 为三档套餐分别创建 `auto_monthly` 订阅 Price（Sandbox 已建 Standard / Pro / Ultimate）
- [x] **SPAY-102** 为三档套餐分别创建 `one_time` 一次性 Price
- [x] **SPAY-103** 创建四个积分包 Product：`500 / 1200 / 3500 / 8000`
- [x] **SPAY-104** 收口多币种策略：仅 `USD / CNY` 手动固定，其他地区走 Stripe Adaptive Pricing
- [x] **SPAY-105** 统一 Product / Price 命名规范与最小 Metadata 规范（metadata 不再作为运行时阻塞项）
- [x] **SPAY-106** 配置 Stripe Customer Portal 可管理订阅、取消订阅与支付方式

#### Phase 1 当前状态（2026-04-22）

1. **当前 Dashboard 模型已从“多 Product”收口为“单 Product Bundle + 多 Price”**
   - 当前沙盒 Product 为：`prod_UNKvLrNY5h3O8j`（Nano Banana Canvas Bundle）。
   - 当前不再坚持“Standard / Pro / Ultimate 各一个 Product”的教条，而是接受 Stripe 后台更简洁的一个 Product 承载多个套餐 Price。
2. **Sandbox 已存在三条 recurring 套餐 Price**
   - `Standard`: `price_1TOaFXEaFSfu5kGH9qYwD8tK`
   - `Pro`: `price_1TOaIGEaFSfu5kGH2s6ocPIe`
   - `Ultimate`: `price_1TOaIpEaFSfu5kGHIqYjzQ1i`
3. **多币种建模已收口为“USD/CNY 手动 + 其他地区 Adaptive Pricing”**
   - 当前手动固定币种只保留 `usd / cny`。
   - 其他地区不再在 Dashboard 手动补 `eur / gbp / ...` 固定 Price，而是默认交给 Stripe Adaptive Pricing 自动本地化。
   - 代码侧也不再要求每个币种都维护一组独立 Price ID；只有未来确实要锁死某个币种金额时才额外拆 Price。
4. **命名现实与代码语义对齐**
   - 后台展示名曾出现 `Ultimatex`，但当前代码、数据库和文档统一继续使用内部语义 `ultimate`。
   - 这意味着 `Ultimatex` 只视为后台展示命名差异，不新增第四档套餐。
5. **一次性套餐 Price 已补齐**
   - 当前 one-time Product 为：`prod_UNdPVZafOiTcwD`
   - `Standard`: `price_1TOs93EaFSfu5kGHfIDvE0jM`
   - `Pro`: `price_1TOsAqEaFSfu5kGH8FKN3whW`
   - `Ultimate`: `price_1TOsAPEaFSfu5kGHMqetM1Xq`
   - 当前没有补 Stripe Dashboard metadata，不阻塞运行时推进；后续若需要让后台运营可读性更强，再回补即可
6. **积分包 Product 与 Price 已补齐**
   - 当前 credit-pack Product 为：`prod_UNdhVWSY14g6f8`
   - `500 credits`: `price_1TOsQ2EaFSfu5kGHPXzmTO2P`
   - `1200 credits`: `price_1TOsQdEaFSfu5kGHdeuL7JfC`
   - `3500 credits`: `price_1TOsR4EaFSfu5kGHGdEJkr2z`
   - `8000 credits`: `price_1TOsRQEaFSfu5kGH4xurdNtz`
7. **Metadata 当前定位已澄清并降级为“非阻塞运营增强项”**
   - Stripe 后台右侧红框“元数据”确实就是 metadata 编辑入口。
   - Product 级 metadata 只适合放所有子 Price 共享的键，例如 `kind=plan`、`purchase_mode=plan_one_time` 或 `kind=credit_pack`。
   - 像 `plan=standard/pro/ultimate`、`package_id=500/1200/3500/8000` 这类随 Price 变化的值，不应该三档共用一组 Product metadata。
   - 当前运行时不依赖 Dashboard metadata 才能正确下单，因此 metadata 规范冻结后，不再阻塞 Phase 1 收口。
8. **Customer Portal 已在 Sandbox 完成基础配置**
   - 当前 Portal Configuration ID：`bpc_1TOsxnEaFSfu5kGHU7OAQ9Zi`
   - 当前测试链接已激活：`https://billing.stripe.com/p/login/test_4gM14n9NqfT66zO8088so00`
   - 当前项目推荐的回跳落点仍是 `/account`，不建议长期把回跳落到 `/explore`
9. **Adaptive Pricing 的 Sandbox 状态已确认**
   - 你提供的 Dashboard 截图位置为：`付款 -> Adaptive Pricing -> Checkout、Elements 以及托管账单页面`。
   - 当前 Sandbox 中该开关已处于开启状态，可以支撑我们“`USD / CNY` 手动固定，其他地区自动本地化”的现行策略。
   - 因此 `SPAY-104` 现已可正式收口为完成。

### Phase 2：环境变量与服务端配置

- [x] **SPAY-200** 在 `apps/web/.env.example` 补齐 Stripe 所需环境变量占位
- [x] **SPAY-201** 创建 `lib/stripe/config.ts`，集中解析 Secret Key、Webhook Secret、Price ID
- [x] **SPAY-202** 创建 `resolveStripePriceId()`，按 `plan / purchaseMode / packageId / currency` 解析 Price
- [x] **SPAY-203** 建立 `currency whitelist` 与 `CF-IPCountry -> currency` 推断器
- [x] **SPAY-204** 为价格缺失、币种缺失、非法 purchaseMode 增加统一错误码

#### Phase 2 Batch A 结论（2026-04-21）

1. 已在 `apps/web/.env.example` 完成 Stripe 新方案占位：
   - 新增 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`、`STRIPE_PORTAL_CONFIGURATION_ID`、`STRIPE_DEFAULT_CURRENCY`
   - 初版为 `Standard / Pro / Ultimate` 与积分包预留“按币种拆 Price”占位
   - 后续已在 2026-04-22 收口为“优先共享 Price ID，按需兼容币种拆 Price”的更贴近 Stripe 官方模型的写法
2. 已新增 `apps/web/lib/billing/config.ts` 作为当前 Stripe 配置真相源：
   - 集中解析 Secret Key / Webhook Secret / Portal Config / Price IDs
   - 提供 `getPlanPriceEnvKey()`、`getCreditPackPriceEnvKey()` 命名规范生成器
   - 提供 `getStripeBillingConfig()` 统一配置入口
3. 已实现 `resolveStripePriceId()`：
   - 套餐模式优先解析共享 Price ID，必要时才回退到 `plan + purchaseMode + currency`
   - 积分包模式优先解析共享 Price ID，必要时才回退到 `packageId + currency`
   - Price 缺失时统一抛出 `BILLING_PRICE_NOT_CONFIGURED`
4. 已实现币种白名单与推断器：
   - 手动固定币种白名单已收口为 `usd / cny`
   - `resolveBillingCurrency()` 优先接收显式币种；未传时回退到 `inferCurrencyFromCountry()`
   - 国家推断规则与 Phase 0 对齐：`CN -> cny`、其他地区统一回退 `usd`
5. 已补统一错误码：
   - `BILLING_CONFIG_INVALID`
   - `BILLING_PLAN_INVALID`
   - `BILLING_PACKAGE_INVALID`
   - `BILLING_CURRENCY_UNSUPPORTED`
   - `BILLING_PURCHASE_MODE_INVALID`
   - `BILLING_PRICE_NOT_CONFIGURED`
6. 已完成本地验证：
   - `pnpm --filter @nano-banana/web test -- lib/billing/config.test.ts lib/api/response.test.ts`
   - `pnpm --filter @nano-banana/web exec tsc --noEmit`

#### Phase 2 Batch B 结论（2026-04-22）

1. **多币种 Price 建模已纠偏**
   - 从“每个币种一组独立 Price ID”的错误假设，修正为“优先共享 Price ID + 仅对 `USD/CNY` 保留手动固定入口”。
   - `.env.example` 已同步改成：共享 Price ID 为主，`USD/CNY` 币种拆分 Price 作为兼容备用。
2. **配置层已兼容两种 Stripe 后台建模**
   - 场景 A：一个 Stripe Price 走共享 Price ID，并由 Stripe Adaptive Pricing 自动本地化。
   - 场景 B：`USD / CNY` 需要锁死金额 → 仍可通过 `*_USD / *_CNY` 补充。
3. **Checkout 不再把“IP 推断币种”误当成“必须独立 Price 解析”**
   - IP 推断只负责决定是否走 `CNY fixed` 或 `USD base`。
   - `USD/CNY` 之外地区的本地币种展示，交由 Stripe Checkout + Adaptive Pricing 处理。
4. **Phase 1 当前代码口径已与新策略对齐**
   - `apps/web/lib/billing/config.ts` 当前只接受 `usd / cny` 两种手动固定币种。
   - `apps/web/.env.example` 已移除 `EUR / GBP` 固定 Price 占位，避免后续继续维护所有币种的手动价格。
   - 按当前要求，本轮先跳过测试，等全部完成并部署生产后再统一完整验证。
4. **本地验证已再次通过**
   - `pnpm --filter @nano-banana/web test -- lib/billing/config.test.ts`
   - `pnpm --filter @nano-banana/web build`

### Phase 3：数据库与账本结构

- [x] **SPAY-300** 在 `schema.sql` 重建 `credit_balances`
- [x] **SPAY-301** 在 `schema.sql` 重建 `credit_transactions`
- [x] **SPAY-302** 在 `schema.sql` 重建 `subscriptions`
- [x] **SPAY-303** 在 `schema.sql` 重建 `model_pricing`
- [x] **SPAY-304** 在 `schema.sql` 重建 `credit_packages`
- [x] **SPAY-305** 新增 `processed_stripe_events` 幂等表
- [x] **SPAY-306** 评估是否单独新增 `billing_orders` 表，用于一次性套餐与积分包订单审计
- [x] **SPAY-307** 更新 `seed-pricing.sql`，改成 `credits_per_1k_units`
- [x] **SPAY-308** 为 `subscriptions` 增加 `purchase_mode` 与 `storage_gb`

#### Phase 3 结论（2026-04-21）

1. 已在 `apps/web/db/schema.sql` 重建 7 张商业化核心表：
   - `credit_balances`
   - `credit_transactions`
   - `subscriptions`
   - `model_pricing`
   - `credit_packages`
   - `processed_stripe_events`
   - `billing_orders`
2. `credit_balances` 已按双池模型落地：
   - `monthly_balance`
   - `permanent_balance`
   - `frozen_credits`
   - `total_earned / total_spent`
3. `subscriptions` 已对齐新主方案：
   - `plan` 支持 `free / standard / pro / ultimate`
   - `purchase_mode` 支持 `auto_monthly / one_time`
   - `storage_gb` 与 `monthly_credits` 已进入本地权益镜像
4. `model_pricing` 已切换为 token/生成量计费口径：
   - 统一使用 `credits_per_1k_units`
   - 保留 `tier / min_plan / category / is_active`
5. `billing_orders` 评估结论：
   - 需要单独建表
   - 原因：一次性套餐与积分包都不适合只挂在 `subscriptions` 上，否则“订阅状态”和“一次性订单审计”会混成一个表，后续退款、对账、重放 Webhook 都会变脏
6. 已新增配套文件：
   - `apps/web/db/migration-011-billing-rebuild.sql`
   - `apps/web/db/seed-pricing.sql`
7. 已完成本地验证：
   - 干净临时 D1：`schema.sql` 执行成功
   - 干净临时 D1：`seed-pricing.sql` 执行成功
   - 验证计数：`credit_packages = 4`，`model_pricing = 19`
   - `pnpm --filter @nano-banana/web exec tsc --noEmit`
8. 验证备注：
   - 现有默认 `.wrangler` 本地库因为历史 schema 落后，会在 `db:init` 时先撞到旧列不一致；这不是本轮 SQL 结构错误
   - 本轮验证已改用独立临时 `persist-to` 目录完成，避免污染现有本地数据库状态

### Phase 4：Stripe 服务层

- [x] **SPAY-400** 重建 `lib/stripe.ts` 或拆分为 `lib/billing/stripe-client.ts`
- [x] **SPAY-401** 实现 `getOrCreateStripeCustomer()`
- [x] **SPAY-402** 实现 Checkout Session 创建器，支持三类订单
- [x] **SPAY-403** 实现 Customer Portal Session 创建器
- [x] **SPAY-404** 实现 Subscription cancel 服务
- [x] **SPAY-405** 实现 Webhook 签名验证器
- [x] **SPAY-406** 实现 Webhook 幂等处理器
- [x] **SPAY-407** 为 Stripe 错误码做本地异常映射

#### Phase 4 Batch A 结论（2026-04-22）

1. 已新增 `apps/web/lib/billing/stripe-client.ts`
   - 负责 Stripe SDK 初始化
   - 校验 `NEXT_PUBLIC_APP_URL`
   - 绑定或创建 Stripe Customer
   - 预留并维护本地 `subscriptions` 镜像占位
2. 已新增 `apps/web/lib/billing/plans.ts`
   - 统一维护 `standard / pro / ultimate` 的 `monthlyCredits / storageGB`
   - 避免把套餐权益散落到 route handler 中
3. 已新增 `apps/web/lib/billing/checkout.ts`
   - 当前先打通 `plan_auto_monthly`
   - 创建 Checkout Session 时已把 `userId / plan / purchaseMode / monthlyCredits / storageGB` 写入 metadata
4. 当前未完成项
   - `credit_pack`
   - Portal / Cancel / Webhook 签名与幂等

#### Phase 4 Batch B 结论（2026-04-22）

1. Checkout Session 创建器已接回 `plan_one_time`
   - `plan_auto_monthly` 继续走 Stripe `subscription`
   - `plan_one_time` 改走 Stripe `payment`
2. 本地 `apps/web/.env.local` 已写入三档 one-time Price ID
   - `STRIPE_PRICE_STANDARD_PLAN_ONE_TIME`
   - `STRIPE_PRICE_PRO_PLAN_ONE_TIME`
   - `STRIPE_PRICE_ULTIMATE_PLAN_ONE_TIME`
3. 当前仍未完成项
   - `credit_pack`
   - Portal / Cancel / Webhook 签名与幂等

#### Phase 4 Batch C 结论（2026-04-22）

1. Checkout Session 创建器已补齐 `credit_pack`
   - `plan_auto_monthly` 继续走 Stripe `subscription`
   - `plan_one_time` 与 `credit_pack` 统一走 Stripe `payment`
2. 本地 `apps/web/.env.local` 已写入四档积分包 Price ID
   - `STRIPE_PRICE_CREDIT_PACK_500`
   - `STRIPE_PRICE_CREDIT_PACK_1200`
   - `STRIPE_PRICE_CREDIT_PACK_3500`
   - `STRIPE_PRICE_CREDIT_PACK_8000`
3. `checkout` metadata 已按订单类型分流
   - 套餐单保留 `plan / purchaseMode / monthlyCredits / storageGB`
   - 积分包单改写为 `packageId / purchaseMode / preferredCurrency`
4. 当前仍未完成项
   - Portal / Cancel / Webhook 签名与幂等

#### Phase 4 Batch D 结论（2026-04-22）

1. 已新增 `apps/web/lib/billing/portal.ts`
   - 登录用户可复用现有 Stripe Customer 绑定逻辑
   - 统一创建 Stripe Customer Portal Session
2. Portal 回跳地址已固定到 `/account?billing=portal_return`
   - 避免用户离开 Stripe 后回到匿名落点
   - 后续 `/billing` 页面重建时再决定是否切到专用账单页
3. 当前仍存在的外部阻塞
   - 已解除：`STRIPE_PORTAL_CONFIGURATION_ID` 已获取，可写入本地运行时
   - 后续只需在真实环境重复同样配置，并补正式 `bpc_...`

#### Phase 4 Batch E 结论（2026-04-22）

1. 已新增 `apps/web/lib/billing/subscription.ts`
   - 统一读取本地 `subscriptions` 镜像摘要
   - 统一暴露当前用户是否具备 Portal / Cancel 能力
2. 已补 `cancelBillingSubscription()`
   - 当前只处理 Stripe `auto_monthly` 自动月付订阅
   - 取消策略先采用 `cancel_at_period_end=true`，避免立即打断已支付周期
3. Stripe SDK 字段差异已对齐
   - 当前订阅周期改从 `subscription.items.data[0]` 读取
   - 与当前“单订阅单价格”套餐模型一致

#### Phase 4 Batch F 结论（2026-04-22）

1. 已新增 `apps/web/lib/billing/webhook.ts`
   - 支持 Stripe Webhook 签名校验
   - 支持 `processed_stripe_events` 幂等保护
2. 当前已接回的 Stripe 事件
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. 当前本地落账能力
   - 自动月付订阅：同步 `subscriptions` 镜像、续费时重置月度积分
   - 一次性套餐：落 `billing_orders` 审计，并同步本地套餐镜像
   - 积分包：落 `billing_orders` 审计，并发放永久积分
4. 当前仍保留的边界
   - 退款、争议、支付失败等反向事件尚未接回
   - 更复杂的积分冻结/确认/回滚仍待 Phase 5 权益引擎闭环

#### Phase 4 Batch G 结论（2026-04-22）

1. 已补齐 Stripe 原生异常到本地 `BillingError` 的统一映射
   - 新增 `apps/web/lib/billing/stripe-error.ts`
   - 当前 `checkout / portal / cancel / getOrCreateStripeCustomer` 已统一复用该适配层
2. 当前已接回的本地异常语义
   - `BILLING_PAYMENT_DECLINED`
   - `BILLING_RATE_LIMITED`
   - `BILLING_NETWORK_ERROR`
   - `BILLING_PROVIDER_ERROR`
   - `StripeAuthenticationError / StripePermissionError` 会统一回落到 `BILLING_CONFIG_INVALID`
3. 当前 API 状态码也已同步
   - 支付拒绝：`402`
   - Stripe 限流：`429`
   - 网络失败：`503`
   - Stripe 服务侧失败：`502`
4. 当前验证结果
   - `pnpm --filter @nano-banana/web test -- lib/billing/stripe-error.test.ts`
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web exec -- tsc --noEmit`

### Phase 5：积分与权益引擎

- [x] **SPAY-500** 重建 token 计费版本的 `model_pricing` 查询器
- [x] **SPAY-501** 实现 `estimateBillableUnits()`，统一文本/图片/视频/音频计费单位
- [x] **SPAY-502** 重建 `freeze / confirm / refund` 三阶段积分事务
- [x] **SPAY-503** 实现“订阅积分池 + 永久积分池”双池扣减顺序
- [x] **SPAY-504** 实现一次性套餐发放积分逻辑
- [x] **SPAY-505** 实现自动月付续费后重置积分逻辑
- [x] **SPAY-506** 实现套餐变化时的 `storageGB` 同步逻辑
- [x] **SPAY-507** 实现 `Free` 降级逻辑：订阅积分归零、存储降级但不删数据

#### Phase 5 Batch A 结论（2026-04-22）

1. 已新增 `apps/web/lib/billing/entitlements.ts`
   - 统一维护 `subscriptions` 本地镜像
   - 统一维护 `users.plan / membership_status`
   - 统一维护月度积分重置、一次性套餐积分发放与 Free 降级
2. 套餐与积分包 snapshot 已收口到 `apps/web/lib/billing/plans.ts`
   - `Standard / Pro / Ultimate` 继续作为 `monthlyCredits / storageGB` 唯一真相源
   - `500 / 1200 / 3500 / 8000` 积分包不再在 `pricing.ts` 与 `webhook.ts` 双写
3. Webhook 当前不再直接操纵权益细节
   - `checkout.session.completed` 先记录订单，再调用权益兑现层发放一次性套餐/积分包积分
   - `invoice.paid` 先同步订阅镜像，再通过权益兑现层重置月度积分
   - `customer.subscription.updated/deleted` 统一复用权益兑现层处理存储与会员状态同步
4. 当前降级语义已澄清
   - 降级到 `Free` 时会把订阅积分池重置为 `0`
   - 永久积分池保留，不删除用户已购买的积分资产
   - `storageGB` 降为 Free 档镜像，但不主动删除既有文件
5. 当前仍未完成的权益引擎边界
   - `SPAY-500 ~ SPAY-503` 的 token 计费、预估计量、三阶段事务与双池扣减顺序仍待后续接回
   - 退款、争议、支付失败等反向账务事件仍不在本批闭环内

#### Phase 5 Batch B 结论（2026-04-22）

1. 已新增 `apps/web/lib/billing/metering.ts`
   - 当前 `getModelPricing()` 已成为 token 计费版 `model_pricing` 查询真相源
   - 当前 `estimateBillableUnits()` 已统一文本 / 图片 / 视频 / 音频四类 billable units 口径
   - 当前 `estimateCreditsFromUsage()` 已统一把 billable units 按 `credits_per_1k_units` 折算为 credits
2. 已新增 `apps/web/lib/billing/ledger.ts`
   - 当前 `freezeCredits()` 已按“订阅积分池优先、永久积分池补位”执行双池冻结
   - 当前 `confirmFrozenCredits()` / `refundFrozenCredits()` 已统一接住三阶段事务的确认消费与失败退回
   - 当前冻结拆分不再额外写冗余状态列，而是复用 `credit_transactions.reference_id + pool + type` 回放 reference 级冻结/结算/剩余语义
3. 异步任务计量草稿已补齐到双模式
   - `apps/web/lib/tasks/service.ts` 当前会在 `platform / user_key` 两条任务提交链里都写入 `billingDraft`
   - 这一步先把异步图片 / 视频 / 音频任务的预估计量挂进任务输入，为 Phase 7 真正接扣费链铺底
4. usage 日志计量已与新口径对齐
   - `apps/web/app/api/ai/execute/route.ts` 与 `stream/route.ts` 当前已写入 `billable_units / estimated_credits`
   - `apps/web/lib/billing/credits.ts` 当前优先读取新列，旧 token 求和 SQL 只保留回退兼容
5. 当前验证结果
   - `pnpm --filter @nano-banana/web test -- lib/billing/ledger.test.ts lib/billing/metering.test.ts lib/billing/credits.test.ts`
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web exec -- tsc --noEmit`
6. 当前仍保留的边界
   - `ai/execute` / `ai/stream` 还没有真正调用 `freeze / confirm / refund`，目前先完成 usage 计量与事务真相源落地
   - Worker/Cron 的超时退款、解冻与 `user_key` 模式“只记 usage 不扣平台积分”仍待 `SPAY-700 ~ SPAY-705`

### Phase 6：API 路由

- [x] **SPAY-600** 重建 `POST /api/billing/checkout`
- [x] **SPAY-601** 重建 `POST /api/billing/portal`
- [x] **SPAY-602** 重建 `POST /api/billing/cancel`
- [x] **SPAY-603** 重建 `GET /api/billing/subscription`
- [x] **SPAY-604** 重建 `GET /api/billing/packages`
- [x] **SPAY-605** 重建 `POST /api/billing/topup`
- [x] **SPAY-606** 重建 `POST /api/webhooks/stripe`
- [x] **SPAY-607** 重建 `GET /api/credits/balance`
- [x] **SPAY-608** 重建 `GET /api/credits/transactions`
- [x] **SPAY-609** 重建 `GET /api/credits/usage`
- [x] **SPAY-610** 重建 `GET /api/pricing/plans`

#### Phase 6 Batch A 结论（2026-04-22）

1. 已恢复 `POST /api/billing/checkout`
   - 路由位置：`apps/web/app/api/billing/checkout/route.ts`
   - 当前必须登录，匿名用户不会直接进入结账
2. 当前 Checkout API 行为
   - 请求体只接收业务语义：`plan`、`purchaseMode`
   - `purchaseMode` 当前已开放 `plan_auto_monthly / plan_one_time`
   - 币种偏好通过显式参数或 `CF-IPCountry` 推断得到，但不再强迫映射为“独立币种 Price ID”
3. 当前验证结果
   - `eslint` 通过
   - `vitest` 中 `lib/billing/config.test.ts` 通过
   - `pnpm --filter @nano-banana/web build` 通过

#### Phase 6 Batch B 结论（2026-04-22）

1. 已恢复 `GET /api/pricing/plans`
   - 路由位置：`apps/web/app/api/pricing/plans/route.ts`
   - 当前按 `CF-IPCountry` 或显式 `currency` 参数解析展示币种
   - 数据不是本地硬编码，而是服务端实时读取 Stripe `plan_auto_monthly` Price
2. 当前返回内容
   - `standard / pro / ultimate` 三档公开套餐
   - `unitAmount / currency / monthlyCredits / storageGB / stripePriceId`
   - 当前只覆盖 `auto_monthly` 订阅价，不混入 `one_time / credit_pack`
3. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test`
   - `pnpm --filter @nano-banana/web build`

#### Phase 6 Batch C 结论（2026-04-22）

1. `POST /api/billing/checkout` 已支持三类业务语义
   - `plan_auto_monthly`
   - `plan_one_time`
   - `credit_pack`
2. 当前请求体继续只接业务字段，不接客户端伪造价格
   - 套餐链路传 `plan + purchaseMode`
   - 积分包链路传 `packageId + purchaseMode`
3. Stripe Checkout Session 的真实 Price 仍由服务端解析
   - 继续依据 `purchaseMode / plan / packageId / currency`
   - 不把 UI 金额当作支付真相源
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test`
   - `pnpm --filter @nano-banana/web build`

#### Phase 6 Batch D 结论（2026-04-22）

1. 已恢复 `POST /api/billing/portal`
   - 路由位置：`apps/web/app/api/billing/portal/route.ts`
   - 当前必须登录，匿名用户不能直接进入 Stripe Customer Portal
2. 当前 Portal API 行为
   - 不接收客户端自定义账单参数
   - 服务端只基于当前登录用户创建 Portal Session
   - 如果缺少 `STRIPE_PORTAL_CONFIGURATION_ID`，会明确返回配置错误，而不是静默失败
3. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test`
   - `pnpm --filter @nano-banana/web build`

#### Phase 6 Batch E 结论（2026-04-22）

1. 已恢复 `GET /api/billing/subscription`
   - 路由位置：`apps/web/app/api/billing/subscription/route.ts`
   - 当前返回本地订阅镜像摘要：`plan / purchaseMode / status / currentPeriod / cancelAtPeriodEnd`
2. 已恢复 `POST /api/billing/cancel`
   - 路由位置：`apps/web/app/api/billing/cancel/route.ts`
   - 当前只对 `auto_monthly` 自动月付订阅生效
   - 当前策略不是立即删除订阅，而是标记 `cancel_at_period_end`
3. 当前残留边界
   - `one_time` 与 `credit_pack` 不应进入“取消订阅”语义，因此会被明确拒绝
   - 真实到期后的降级与积分重置仍依赖后续 Webhook / 权益引擎接回
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test`
   - `pnpm --filter @nano-banana/web build`

#### Phase 6 Batch F 结论（2026-04-22）

1. 已恢复 `POST /api/webhooks/stripe`
   - 路由位置：`apps/web/app/api/webhooks/stripe/route.ts`
   - 当前先处理 Stripe 支付主链最关键的 4 类事件
2. 当前 Webhook 行为
   - 先做签名校验，再做事件幂等
   - 只对已支持的事件执行落账，其他事件会安全忽略
3. 当前本地同步效果
   - `checkout.session.completed`：记录一次性套餐/积分包订单，或补齐自动月付订阅镜像
   - `invoice.paid`：自动月付续费后重置月度积分
   - `customer.subscription.updated/deleted`：同步取消状态与降级到 `free`
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test`
   - `pnpm --filter @nano-banana/web build`

#### Phase 6 Batch G 结论（2026-04-22）

1. 已恢复 `GET /api/credits/balance`
   - 路由位置：`apps/web/app/api/credits/balance/route.ts`
   - 当前必须登录，匿名用户不能直接读取积分账本摘要
2. 当前余额 API 返回口径
   - 双池余额：`monthlyBalance / permanentBalance / frozenCredits`
   - 聚合结果：`availableCredits / totalCredits`
   - 套餐镜像：`plan / membershipStatus / currentPlanMonthlyCredits / storageGB`
3. 当前实现方式
   - 新增 `apps/web/lib/billing/credits.ts` 统一读取 `users + credit_balances + subscriptions`
   - 如果用户已有账户但尚未生成 `credit_balances` 行，会先自动补齐空余额行，再返回摘要
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test -- lib/billing/credits.test.ts`

#### Phase 6 Batch H 结论（2026-04-22）

1. 已恢复 `GET /api/credits/transactions`
   - 路由位置：`apps/web/app/api/credits/transactions/route.ts`
   - 当前返回分页结果：`items / total / page / pageSize / hasMore`
   - 当前流水直接读取 `credit_transactions` 真相源，不再让账单页自己拼 SQL 语义
2. 已恢复 `GET /api/credits/usage`
   - 路由位置：`apps/web/app/api/credits/usage/route.ts`
   - 当前返回三组聚合：`summary / byModel / daily`
   - 当前 usage 统计窗口默认 `30` 天，可通过 `windowDays` 查询参数调整
3. 当前 usage 口径说明
   - 数据源为 `ai_usage_logs + model_pricing`
   - 当前 `estimatedCreditsSpent` 是基于 `input_tokens + output_tokens` 与 `credits_per_1k_units` 计算的展示摘要
   - 这一步先解决账单页统计可读性，不冒充已经接回 `freeze / confirm / refund` 的真实执行扣费链
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test -- lib/billing/credits.test.ts`

#### Phase 6 Batch I 结论（2026-04-22）

1. 已恢复 `GET /api/billing/packages`
   - 路由位置：`apps/web/app/api/billing/packages/route.ts`
   - 当前返回公开积分包目录：`currency + creditPacks`
   - 当前继续复用 Stripe 动态价格，不在服务端硬编码金额
2. 已恢复 `POST /api/billing/topup`
   - 路由位置：`apps/web/app/api/billing/topup/route.ts`
   - 当前必须登录，只接收 `packageId + currency` 业务语义
   - 当前实际仍统一走 `credit_pack` Checkout Session 创建器，避免平行维护第二套支付编排
3. 当前服务层收口方式
   - `lib/billing/pricing.ts` 新增独立积分包目录读取能力
   - `lib/validations/billing.ts` 新增 `topupSchema`
   - 积分包目录读取与积分包充值不再被迫复用 `/pricing/plans` 与 `/billing/checkout` 的更宽泛语义

#### Phase 4/6 主线同步记录（2026-04-22）

1. `feat/stripe-checkout-phase4` 已于 2026-04-22 合并进入 `main`，后续 Stripe 重建统一直接在 `main` 推进。
2. 这次主线同步没有新增运行时代码语义，只是把已完成的 `config / checkout / checkout API / 文档` 进度收口到主分支，避免后续继续在分叉状态下推进。
3. 因此当前 `main` 的真实 Stripe 状态已经与本清单中的 `Phase 4 Batch A`、`Phase 6 Batch A` 描述一致。

### Phase 7：执行链路接回

- [x] **SPAY-700** 在 `ai/execute` 中接回 token 预估与 credits freeze
- [x] **SPAY-701** 在 `ai/stream` 中接回流式执行的 billing draft 与完成后结算
- [x] **SPAY-702** 在 `tasks/service` 中接回任务失败退款
- [x] **SPAY-703** 在 Worker/Cron 中接回超时任务退款
- [x] **SPAY-704** 在 Worker/Cron 中接回超时冻结解冻
- [x] **SPAY-705** 重新校准 `user_key` 模式：只记 usage log，不扣平台积分

#### Phase 7 Batch A 结论（2026-04-22）

1. 已在 `apps/web/app/api/ai/execute/route.ts` 接回平台模式扣费链
   - 平台模式当前会先基于 `messages + maxTokens` 预估保守冻结额度
   - Provider 成功返回后，再按真实 usage 计算实际 credits
2. 已补齐“预冻结与实际消耗不完全相等”的结算能力
   - `apps/web/lib/billing/ledger.ts` 当前支持对同一个 `referenceId` 做部分确认与剩余退款
   - 这让 `ai/execute` 可以处理“先多冻，后按实际消耗确认”的真实运行时语义
3. `user_key` 同步链当前仍保持不扣平台积分
   - 当前 `ai/execute` 的 `user_key` 模式继续只写 usage log，不会误扣平台 credits
   - 但 `tasks/service` 与 Worker/Cron 侧的 `SPAY-702 ~ SPAY-705` 仍未收口，不能据此宣称整条 Phase 7 已完成
4. 已补充回归测试
   - 新增 `apps/web/app/api/ai/execute/route.test.ts`
   - `apps/web/lib/billing/ledger.test.ts` 已补 partial confirm 场景，保护“确认实际消耗 + 退回剩余冻结”的边界
5. 当前验证结果
   - `pnpm --filter @nano-banana/web test -- lib/billing/ledger.test.ts app/api/ai/execute/route.test.ts`
   - `pnpm --filter @nano-banana/web exec -- tsc --noEmit`
   - `pnpm --filter @nano-banana/web lint`

#### Phase 7 Batch B 结论（2026-04-22）

1. 已在 `apps/web/app/api/ai/stream/route.ts` 接回平台模式流式扣费链
   - 平台模式当前会在开始流式输出前先按 `messages + maxTokens` 预估冻结额度
   - 流结束后会按实际输出文本重新估算 credits，并执行 `confirm / refund`
2. 流式执行当前已与非流式执行共用同一套预冻结估算口径
   - `apps/web/lib/billing/metering.ts` 当前新增 `estimateReservedTextExecutionUsage()`
   - `ai/execute` 与 `ai/stream` 现在都复用这套 helper，避免两条文本主链的预冻结逻辑再次分叉
3. `user_key` 模式继续保持“只记 usage、不扣平台积分”
   - 当前 `ai/stream` 的 `user_key` 模式没有接入平台 credits 扣减
   - 这样可以继续保持“平台模式扣平台账本，用户自带 Key 模式只记 usage”的边界清晰
4. 当前未做的事
   - 还没有继续推进 `SPAY-702 ~ SPAY-705`
   - 这意味着异步任务链与 Worker/Cron 的退款/解冻职责仍待后续收口
5. 当前验证状态
   - 按当前约定，本轮未执行测试
   - 待全部完成并部署生产后，再统一进行完整测试

#### Phase 7 Batch C 结论（2026-04-22）

1. 已在 `apps/web/lib/tasks/service.ts` 接回异步任务平台扣费链
   - 平台模式任务现在会在 `submitTask()` 阶段按 `billingDraft.estimatedCredits` 先冻结 credits
   - `checkTask()` 完成态会确认冻结，失败态会退款，取消态也会退回剩余冻结
2. Worker/Cron 现已接住前端轮询之外的超时账本回收
   - `apps/worker/src/cron/timeout.ts` 不再只是把任务标 `failed`
   - 当前会同步按 `task.id` 作为 reference 回放剩余冻结，并把 credits 退回原来的 `monthly/permanent` 池
3. `user_key` 模式的异步任务已与平台账本彻底解耦
   - 当前 `user_key` 模式不再在 `input_data` 中写平台 `billingDraft`
   - 这意味着 `user_key` 任务不会进入平台 credits 的 `freeze / confirm / refund` 语义
4. 当前 Phase 7 的真实状态
   - `SPAY-700 ~ SPAY-705` 已全部收口
   - 同步执行、流式执行、异步任务与超时补偿现在都已接回平台账本闭环
5. 当前验证状态
   - 按当前约定，本轮未执行测试
   - 待全部完成并部署生产后，再统一进行完整测试

### Phase 8：前端 UI

- [x] **SPAY-800** 重建 `/pricing` 页面
- [x] **SPAY-801** 在 Pricing 页面增加 `自动月付 / 一次性套餐 / 积分包` 切换，并按 IP/Stripe 自动解析展示币种
- [x] **SPAY-802** 实现 Free 默认态展示文案，不显示“购买 Free”
- [x] **SPAY-803** 重建 `/billing` 页面
- [x] **SPAY-804** 重建 `CreditBalance` / `PaymentHistory` / `UsageChart`
- [x] **SPAY-805** 在账户页接回账单入口
- [x] **SPAY-806** 在侧边栏接回积分与升级入口，但不污染匿名主链
- [x] **SPAY-807** 为未登录 Checkout 操作补登录跳转与回跳

#### Phase 8 Batch A 结论（2026-04-22）

1. 已恢复公开 `/pricing` 页面
   - 路由位置：`apps/web/app/[locale]/(landing)/pricing/page.tsx`
   - 页面当前动态读取 Stripe 套餐价格，不再在 UI 中硬编码金额
2. 已新增 `components/pricing/pricing-content.tsx`
   - 展示 `standard / pro / ultimate` 三档 `auto_monthly` 订阅价
   - 同时展示本地权益镜像：`monthlyCredits / storageGB`
3. 未登录结账动作已接回登录跳转
   - 匿名用户点击 CTA 会跳到 `/sign-in?redirect_url=/pricing`
   - 已登录用户点击 CTA 会调用 `POST /api/billing/checkout`
4. 当前仍未完成的 UI 范围
   - `one_time / credit_pack / 币种手动切换`
   - `/billing` 页面与账户侧账单入口
   - Free 默认态说明文案的完整产品化表达

#### Phase 8 Batch B 结论（2026-04-22）

1. `/pricing` 已新增 `自动月付 / 一次性套餐` 切换
2. 两种套餐价格都从 Stripe 实时读取，不在前端硬编码金额
3. 登录后 CTA 行为已分流
   - 月付套餐：创建 `subscription` Checkout Session
   - 一次性套餐：创建 `payment` Checkout Session
4. 当前仍未完成的 UI 范围
   - `credit_pack`
   - 币种手动切换
   - `/billing` 页面与账户侧账单入口

#### Phase 8 Batch C 结论（2026-04-22）

1. `/pricing` 已新增第三个购买维度：`积分包`
2. 积分包价格同样从 Stripe 实时读取，不在前端硬编码金额
3. 积分包 CTA 已接到统一 Checkout API
   - 登录用户直接创建 `credit_pack` Checkout Session
   - 匿名用户继续先跳登录，再回跳 `/pricing`
4. 当前仍未完成的 UI 范围
   - 币种手动切换
   - `/billing` 页面与账户侧账单入口

#### Phase 8 Batch D 结论（2026-04-22）

1. `/account` 的个人资料 Tab 已新增“管理订阅与账单”入口
2. 登录用户点击后会请求 `POST /api/billing/portal`
   - 成功时跳转到 Stripe Customer Portal
   - 失败时在页面内用 toast 给出明确错误
3. 当前仍未完成的 UI 范围
   - `/billing` 专用账单页
   - 币种手动切换

#### Phase 8 Batch E 结论（2026-04-22）

1. 已恢复 `/billing` 页面
   - 路由位置：`apps/web/app/[locale]/(app)/billing/page.tsx`
   - 当前页面聚合本地 `subscription / balance / transactions / usage` 四类摘要
   - 当前页面仍保持 `noindex`，避免把私有账单页暴露给搜索引擎
2. 已重建本地账单组件
   - `CreditBalanceCard`：展示双池余额、冻结积分、套餐额度与存储镜像
   - `PaymentHistoryTable`：展示 `credit_transactions` 最近流水
   - `UsageChart`：展示最近 30 天的 `summary / daily / byModel` 用量摘要
3. 已把账户页账单入口从“只跳 Stripe Portal”升级为“双入口”
   - 入口一：打开本地 `/billing` 工作台，先看账本镜像
   - 入口二：继续进入 Stripe Customer Portal 处理订阅、支付方式与账单信息
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test -- lib/billing/credits.test.ts`

#### Phase 8 Batch F 结论（2026-04-22）

1. 已在 `/pricing` 补齐 Free 默认态表达
   - 当前明确说明 `Free` 是默认进入态，不是 Stripe Checkout 商品
   - 当前 CTA 变为“Start/Continue with Free”，不再制造“购买 Free”的错误心智
2. 已在侧边栏接回登录态积分与升级入口
   - 登录用户：展示本地账本入口与当前可用积分摘要，同时提供 `/pricing` 升级入口
   - 匿名用户：继续只保留原有公开主链入口，不展示积分/升级块，避免污染匿名主链
3. 当前实现方式
   - 新增 `useCreditBalance` 读取本地 `/api/credits/balance`
   - `AppSidebar` 仅在 `isAuthenticated=true` 时挂载积分与升级入口
4. 当前验证结果
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web test -- lib/billing/credits.test.ts`

#### Phase 8 Batch G 结论（2026-04-22）

1. `/pricing` 的币种体验已收口为“自动解析”，而不是“让用户手动切换”
   - 当前页面继续只提供 `自动月付 / 一次性套餐 / 积分包` 三种购买模式切换
   - 展示币种仍由 `CF-IPCountry` 与 Stripe Adaptive Pricing 自动决定，不把币种选择负担转嫁给用户
2. 当前币种策略继续与 Phase 1 保持一致
   - 手动固定币种策略仍只存在于后台价格建模层：`USD / CNY`
   - 用户前台不暴露手动币种切换，其他地区继续依赖 Stripe 自动本地化
3. 当前 Phase 8 的真实状态
   - `SPAY-800 ~ SPAY-807` 已全部收口
   - `/pricing` 与 `/billing` 的 UI 主链都已具备真实使用条件
4. 当前验证状态
   - 按当前约定，本轮未执行测试
   - 待全部完成并部署生产后，再统一进行完整测试

### Phase 9：文案、i18n 与法务

- [x] **SPAY-900** 补齐 `messages/en.json` 支付相关文案
- [x] **SPAY-901** 补齐 `messages/zh.json` 支付相关文案
- [x] **SPAY-902** 更新 Terms / Privacy 中的订阅、退款、计费说明
- [x] **SPAY-903** 明确一次性套餐与积分包的退款边界
- [x] **SPAY-904** 明确多币种显示与最终扣费说明

#### Phase 9 Batch A 结论（2026-04-22）

1. 已补齐支付相关双语文案
   - `apps/web/messages/en.json`
   - `apps/web/messages/zh.json`
   - 新增定价页三类边界说明：`计费边界 / 退款边界 / 币种说明`
2. 已把支付边界前置到 `/pricing`
   - 当前用户在进入 Stripe Checkout 前，就能看到：
   - 自动月付与一次性购买的边界不同
   - 一次性套餐与积分包默认不承诺可退款
   - 最终扣费币种与金额以 Stripe Checkout/Portal 为准
3. 已更新 Terms / Privacy 页面法务口径
   - `Terms` 新增：`计费、套餐与积分包`、`退款边界`、`多币种展示与最终扣费`
   - `Privacy` 新增：`支付与账单数据`
   - 同时把 Stripe 作为显式共享方写入隐私政策
4. 当前退款边界已统一
   - 自动月付：取消后默认持续到已支付周期结束，不做当前周期追溯退款
   - 一次性套餐 / 积分包：成功发放后原则上视为已提供的数字计费价值
   - 重复扣费、发放失败等异常账务仍保留个案审核空间
5. 当前多币种说明已统一
   - 页面展示金额是引导信息，不是订单最终真相
   - 最终扣费币种、税费与金额以 Stripe 托管结账页为准

### Phase 10：验证与部署

- [x] **SPAY-1000** 为 Price 解析器写单元测试
- [x] **SPAY-1001** 为 credits 三阶段事务写单元测试
- [x] **SPAY-1002** 为 Webhook 幂等写单元测试
- [x] **SPAY-1003** 为 `/api/billing/checkout` 与 `/api/webhooks/stripe` 写集成测试
- [ ] **SPAY-1004** 手测三类订单：自动月付 / 一次性套餐 / 积分包
- [ ] **SPAY-1005** 手测用户升级、降级、取消、续费、支付失败
- [x] **SPAY-1006** 补齐生产环境 Stripe 密钥
- [x] **SPAY-1007** 配置正式 Stripe Webhook 端点
- [ ] **SPAY-1008** 推送 `main` 触发 GitHub Actions 与 Cloudflare 生产部署

#### Phase 10 Batch A 结论（2026-04-22）

1. 已补 `SPAY-1002` Webhook 幂等测试
   - 新增 `apps/web/lib/billing/webhook.test.ts`
   - 当前覆盖两条关键语义：
   - 不支持的 Stripe 事件会被安全忽略，不触发幂等表写入与权益处理
   - 相同 `event.id` 的重复投递只会在第一次执行真实降级逻辑，第二次会被 `processed_stripe_events` 闸门拦下
2. 当前测试切入方式
   - 选择 `customer.subscription.deleted` 作为最短执行链，避免把订单审计、续费重置和幂等语义混在同一条测试里
   - 直接 mock `getDb()` 与 `applyFreePlanDowngrade()`，把断言焦点锁定在“重复事件不重复落账”
3. 当前验证结果
   - `pnpm --filter @nano-banana/web test -- lib/billing/webhook.test.ts`
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web exec -- tsc --noEmit`

#### Phase 10 Batch B 结论（2026-04-22）

1. 已补 `SPAY-1000` Price 解析器单元测试
   - 继续沿用 `apps/web/lib/billing/config.test.ts` 作为 `resolveStripePriceId()` 真相源测试入口
   - 当前不仅覆盖成功解析，还补齐了非法币种、缺失 plan、缺失 packageId 与价格缺失等守卫分支
2. 当前测试口径已覆盖的解析边界
   - 套餐价按 `plan + purchaseMode + currency` 解析
   - 共享 multi-currency Price 回退
   - 积分包价格解析
   - `BILLING_CURRENCY_UNSUPPORTED`
   - `BILLING_PLAN_INVALID`
   - `BILLING_PACKAGE_INVALID`
   - `BILLING_PRICE_NOT_CONFIGURED`
3. 当前验证结果
   - `pnpm --filter @nano-banana/web test -- lib/billing/config.test.ts`
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web exec -- tsc --noEmit`

#### Phase 10 Batch C 结论（2026-04-22）

1. 已补 `SPAY-1003` 路由集成测试
   - 新增 `apps/web/app/api/billing/checkout/route.test.ts`
   - 新增 `apps/web/app/api/webhooks/stripe/route.test.ts`
2. 当前 Checkout API 已覆盖的编排边界
   - 限流命中时直接返回，不继续调用认证与结账服务
   - 自动月付套餐请求会完成 `auth -> currency -> checkout` 编排
   - `credit_pack` 请求会正确分流到积分包结账语义
   - 计费异常会继续通过 `handleApiError()` 映射为统一 API 响应
3. 当前 Stripe Webhook API 已覆盖的编排边界
   - 成功验签后会调用 `processStripeWebhookEvent()`
   - `BILLING_CONFIG_INVALID` 会映射为 `400`
   - 非 `AppError` 的验签失败会映射为 `WEBHOOK_INVALID`
4. 当前验证结果
   - `pnpm --filter @nano-banana/web test -- app/api/billing/checkout/route.test.ts app/api/webhooks/stripe/route.test.ts`
   - `pnpm --filter @nano-banana/web lint`
   - `pnpm --filter @nano-banana/web exec -- tsc --noEmit`

#### Phase 10 Batch D 结论（2026-04-22）

1. 已补生产部署就绪层配置
   - GitHub Actions 当前已从 `lint -> build -> deploy` 收口为 `lint -> test -> build -> deploy`
   - `apps/web/wrangler.jsonc` 已补非敏感生产运行时变量 `NEXT_PUBLIC_APP_URL`
   - `apps/worker/wrangler.toml` 已把 `ENVIRONMENT` 从 `development` 改回 `production`
2. 已重写生产迁移清单，避免旧方案误导正式接线
   - `.md/archive/生产环境迁移清单.md` 当前已对齐 `standard / pro / ultimate + credit_pack`
   - Live Webhook 事件名已校正为当前代码真实消费的 `checkout.session.completed / invoice.paid / customer.subscription.updated / customer.subscription.deleted`
3. 当前仍未完成的 Phase 10 事项
   - `SPAY-1006` 需要你提供并录入 Stripe Live 密钥与 Price ID
   - `SPAY-1007` 需要你在 Stripe Live Dashboard 创建正式 Webhook endpoint
   - `SPAY-1008` 需要在代码检查完成后推送远程触发生产部署
4. 当前验证状态
   - 按当前阶段目标，这一轮先完成代码与部署配置收口
   - 下一步再统一执行 lint / test / build，并做坏味道巡检

#### Phase 10 Batch E 结论（2026-04-22）

1. 已完成代码层统一质量闸门
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
   - 当前三条检查均已通过
2. 已顺手修掉两类真实回归
   - `app/api/ai/execute/route.test.ts` 的计费 mock 未跟上 `estimateReservedTextExecutionUsage()`
   - `lib/billing/config.test.ts` 的多币种断言仍停留在旧策略，未反映“`USD/CNY` 优先于共享 Price”的现状
3. 当前剩余未完成项只剩 Phase 10 的生产接线与手测
   - `SPAY-1004` 三类订单手测
   - `SPAY-1005` 升级/降级/取消/续费/支付失败手测
   - `SPAY-1006` Stripe Live 密钥与 Price ID
   - `SPAY-1007` 正式 Stripe Webhook endpoint
   - `SPAY-1008` 推送 `main` 触发 GitHub Actions 与 Cloudflare 生产部署
4. 当前已识别的残留坏味道
   - `next build` 仍会提示 `middleware` 约定已废弃
   - 这条当前属于已知兼容性债务：仓库此前已验证 OpenNext/Cloudflare 部署链仍依赖 `middleware.ts`，暂不宜为了消警告直接切成 `proxy.ts`

#### Phase 10 Batch F 结论（2026-04-22）

1. 已拿到 Stripe Live 侧非敏感接线信息
   - Live publishable key 已获取
   - `plan_auto_monthly / plan_one_time / credit_pack` 三类 Live Price ID 已全部获取
   - 当前 Product 命名仍存在后台展示差异（如 `Ultimatex`），但内部运行时语义继续统一为 `ultimate`
2. 当前密钥录入策略已明确分层
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 与 Live Price IDs 可进入部署配置与迁移文档
   - `STRIPE_SECRET_KEY` 与后续 `STRIPE_WEBHOOK_SECRET` 只允许由你手动写入生产环境，不进入 git 历史
3. 当前 `SPAY-1006` 的真实状态
   - Live Price IDs 与 publishable key 已具备
   - 仍待你手动注入 `STRIPE_SECRET_KEY`，以及待创建正式 `Webhook signing secret`
   - 因此 `SPAY-1006` 暂不冒充已完成，继续保持未收口
4. 下一步最短路径
   - 先在 Stripe Live 创建正式 Webhook endpoint
   - 拿到 `whsec_...` 后，再一次性完成 Cloudflare 生产环境 Stripe 变量注入

#### Phase 10 Batch G 结论（2026-04-22）

1. 已完成 Cloudflare Web 生产环境 Stripe 接线
   - 已把当前代码真实消费的 Stripe 变量写入 `nano-banana-web`
   - 包括 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PORTAL_CONFIGURATION_ID / STRIPE_DEFAULT_CURRENCY`
   - 以及当前三类订单所需的 10 个 Live Price IDs
2. 已完成正式 Webhook 端点配置闭环
   - Live endpoint 已创建为 `https://nanobananacanvas.com/api/webhooks/stripe`
   - 监听事件已与当前代码真实消费集合保持一致
   - Live `whsec_...` 已录入 Cloudflare 生产环境
3. 生产环境脏配置已清理
   - Cloudflare 中旧方案遗留的 `*_MONTHLY / *_YEARLY` Stripe secrets 已删除
   - GitHub Actions 的 `NEXT_PUBLIC_APP_URL` 已同步校正为 `https://nanobananacanvas.com`
4. 当前 Phase 10 的真实状态
   - `SPAY-1006` 与 `SPAY-1007` 已完成
   - 剩余主线只剩 `SPAY-1004 / SPAY-1005 / SPAY-1008`
5. 当前未验证项
   - 还未触发新的生产部署
   - 也还未对 Live Webhook 做到端到端 `2xx` 投递验证
   - 这两项都留到 `SPAY-1008` 与后续集中手测阶段收口

---

## 三、推荐落地顺序

1. 先做 `Phase 1 ~ 4`，把 Stripe 资源、环境变量和服务层打稳。
2. 再做 `Phase 3 + 5 + 6`，把账本、API、Webhook 对齐成闭环。
3. 然后接 `Phase 7 + 8`，把执行链和 UI 真正接回运行时。
4. 最后完成 `Phase 9 + 10`，把法务、测试与生产部署补齐。

---

## 四、完成定义

满足以下条件时，Stripe 支付系统才算真正嵌入完成：

1. `Free` 默认态、付费套餐、积分包三者边界清晰。
2. Stripe Checkout、Portal、Webhook 在生产环境可用。
3. 账本支持 `freeze / confirm / refund` 三阶段事务。
4. token 计费规则已接入真实 AI 执行链路。
5. 前端 Pricing / Billing 可被真实用户使用。
6. 关键测试通过，手测支付闭环可跑通。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
