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
   - 币种白名单首批定为：`usd / eur / gbp / cny`
   - 服务端依据 `CF-IPCountry` 推断默认币种：`US -> usd`、`GB -> gbp`、`CN -> cny`、欧盟/欧洲经济区国家优先 `eur`
   - 未命中映射、Cloudflare 本地开发、或国家码缺失时，统一回退 `usd`
   - 客户端可以请求白名单币种，但最终 Price ID 仍由服务端解析，不信任任意客户端价格参数

### Phase 1：Stripe Dashboard 建模

- [~] **SPAY-100** 在 Stripe Dashboard 建立付费套餐商品模型（当前为 `Nano Banana Canvas Bundle` 单 Product + 三个套餐 Price，后续如需拆 Product 再评估）
- [~] **SPAY-101** 为三档套餐分别创建 `auto_monthly` 订阅 Price（Sandbox 已建 Standard / Pro / Ultimate）
- [ ] **SPAY-102** 为三档套餐分别创建 `one_time` 一次性 Price
- [ ] **SPAY-103** 创建四个积分包 Product：`500 / 1200 / 3500 / 8000`
- [~] **SPAY-104** 为所有套餐与积分包补齐多币种 Price（当前 recurring 套餐 Price 已按同一 Price 下 `currency_options` 建模）
- [~] **SPAY-105** 统一 Product / Price 命名规范与 Metadata 规范（Sandbox 命名已落地一版，metadata 仍待补齐）
- [ ] **SPAY-106** 配置 Stripe Customer Portal 可管理订阅、取消订阅与支付方式

#### Phase 1 当前状态（2026-04-22）

1. **当前 Dashboard 模型已从“多 Product”收口为“单 Product Bundle + 多 Price”**
   - 当前沙盒 Product 为：`prod_UNKvLrNY5h3O8j`（Nano Banana Canvas Bundle）。
   - 当前不再坚持“Standard / Pro / Ultimate 各一个 Product”的教条，而是接受 Stripe 后台更简洁的一个 Product 承载多个套餐 Price。
2. **Sandbox 已存在三条 recurring 套餐 Price**
   - `Standard`: `price_1TOaFXEaFSfu5kGH9qYwD8tK`
   - `Pro`: `price_1TOaIGEaFSfu5kGH2s6ocPIe`
   - `Ultimate`: `price_1TOaIpEaFSfu5kGHIqYjzQ1i`
3. **多币种建模已确认采用 Stripe 官方推荐的“单 Price 多币种”**
   - 同一个 Price 下通过 `currency_options` 维护 `usd / eur / gbp / cny` 等本地化金额。
   - 代码侧不再要求每个币种都维护一组独立 Price ID；只有未来确实拆 Price 时才回退到按币种单独配置。
4. **命名现实与代码语义对齐**
   - 后台展示名曾出现 `Ultimatex`，但当前代码、数据库和文档统一继续使用内部语义 `ultimate`。
   - 这意味着 `Ultimatex` 只视为后台展示命名差异，不新增第四档套餐。

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
   - 白名单固定为 `usd / eur / gbp / cny`
   - `resolveBillingCurrency()` 优先接收显式币种；未传时回退到 `inferCurrencyFromCountry()`
   - 国家推断规则与 Phase 0 对齐：`GB -> gbp`、`CN -> cny`、欧盟/欧洲经济区优先 `eur`、其他回退 `usd`
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
   - 从“每个币种一组独立 Price ID”的错误假设，修正为“优先单 Price + `currency_options`”。
   - `.env.example` 已同步改成：共享 Price ID 为主，币种拆分 Price 作为兼容备用。
2. **配置层已兼容两种 Stripe 后台建模**
   - 场景 A：一个 Stripe Price 内部挂多币种 → 只需要一个 Price ID。
   - 场景 B：不同币种真的拆成不同 Price → 仍可通过 `*_USD / *_EUR / *_GBP / *_CNY` 补充。
3. **Checkout 不再把“IP 推断币种”误当成“必须独立 Price 解析”**
   - IP 推断保留为展示/偏好语义。
   - 真正的本地币种展示交由 Stripe Checkout 对 multi-currency Price 的原生支持处理。
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
- [~] **SPAY-402** 实现 Checkout Session 创建器，支持三类订单（当前已打通 `plan_auto_monthly`，`plan_one_time / credit_pack` 待补）
- [ ] **SPAY-403** 实现 Customer Portal Session 创建器
- [ ] **SPAY-404** 实现 Subscription cancel 服务
- [ ] **SPAY-405** 实现 Webhook 签名验证器
- [ ] **SPAY-406** 实现 Webhook 幂等处理器
- [ ] **SPAY-407** 为 Stripe 错误码做本地异常映射

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
   - `plan_one_time`
   - `credit_pack`
   - Portal / Cancel / Webhook 签名与幂等

### Phase 5：积分与权益引擎

- [ ] **SPAY-500** 重建 token 计费版本的 `model_pricing` 查询器
- [ ] **SPAY-501** 实现 `estimateBillableUnits()`，统一文本/图片/视频/音频计费单位
- [ ] **SPAY-502** 重建 `freeze / confirm / refund` 三阶段积分事务
- [ ] **SPAY-503** 实现“订阅积分池 + 永久积分池”双池扣减顺序
- [ ] **SPAY-504** 实现一次性套餐发放积分逻辑
- [ ] **SPAY-505** 实现自动月付续费后重置积分逻辑
- [ ] **SPAY-506** 实现套餐变化时的 `storageGB` 同步逻辑
- [ ] **SPAY-507** 实现 `Free` 降级逻辑：积分归零、存储降级但不删数据

### Phase 6：API 路由

- [x] **SPAY-600** 重建 `POST /api/billing/checkout`
- [ ] **SPAY-601** 重建 `POST /api/billing/portal`
- [ ] **SPAY-602** 重建 `POST /api/billing/cancel`
- [ ] **SPAY-603** 重建 `GET /api/billing/subscription`
- [ ] **SPAY-604** 重建 `GET /api/billing/packages`
- [ ] **SPAY-605** 重建 `POST /api/billing/topup`
- [ ] **SPAY-606** 重建 `POST /api/webhooks/stripe`
- [ ] **SPAY-607** 重建 `GET /api/credits/balance`
- [ ] **SPAY-608** 重建 `GET /api/credits/transactions`
- [ ] **SPAY-609** 重建 `GET /api/credits/usage`
- [ ] **SPAY-610** 重建 `GET /api/pricing/plans`

#### Phase 6 Batch A 结论（2026-04-22）

1. 已恢复 `POST /api/billing/checkout`
   - 路由位置：`apps/web/app/api/billing/checkout/route.ts`
   - 当前必须登录，匿名用户不会直接进入结账
2. 当前 Checkout API 行为
   - 请求体只接收业务语义：`plan`、`purchaseMode`
   - `purchaseMode` 当前仅开放 `plan_auto_monthly`
   - 币种偏好通过显式参数或 `CF-IPCountry` 推断得到，但不再强迫映射为“独立币种 Price ID”
3. 当前验证结果
   - `eslint` 通过
   - `vitest` 中 `lib/billing/config.test.ts` 通过
   - `pnpm --filter @nano-banana/web build` 通过

#### Phase 4/6 主线同步记录（2026-04-22）

1. `feat/stripe-checkout-phase4` 已于 2026-04-22 合并进入 `main`，后续 Stripe 重建统一直接在 `main` 推进。
2. 这次主线同步没有新增运行时代码语义，只是把已完成的 `config / checkout / checkout API / 文档` 进度收口到主分支，避免后续继续在分叉状态下推进。
3. 因此当前 `main` 的真实 Stripe 状态已经与本清单中的 `Phase 4 Batch A`、`Phase 6 Batch A` 描述一致。

### Phase 7：执行链路接回

- [ ] **SPAY-700** 在 `ai/execute` 中接回 token 预估与 credits freeze
- [ ] **SPAY-701** 在 `ai/stream` 中接回流式执行的 billing draft 与完成后结算
- [ ] **SPAY-702** 在 `tasks/service` 中接回任务失败退款
- [ ] **SPAY-703** 在 Worker/Cron 中接回超时任务退款
- [ ] **SPAY-704** 在 Worker/Cron 中接回超时冻结解冻
- [ ] **SPAY-705** 重新校准 `user_key` 模式：只记 usage log，不扣平台积分

### Phase 8：前端 UI

- [ ] **SPAY-800** 重建 `/pricing` 页面
- [ ] **SPAY-801** 在 Pricing 页面增加 `自动月付 / 一次性套餐 / 积分包 / 币种` 切换
- [ ] **SPAY-802** 实现 Free 默认态展示文案，不显示“购买 Free”
- [ ] **SPAY-803** 重建 `/billing` 页面
- [ ] **SPAY-804** 重建 `CreditBalance` / `PaymentHistory` / `UsageChart`
- [ ] **SPAY-805** 在账户页接回账单入口
- [ ] **SPAY-806** 在侧边栏接回积分与升级入口，但不污染匿名主链
- [ ] **SPAY-807** 为未登录 Checkout 操作补登录跳转与回跳

### Phase 9：文案、i18n 与法务

- [ ] **SPAY-900** 补齐 `messages/en.json` 支付相关文案
- [ ] **SPAY-901** 补齐 `messages/zh.json` 支付相关文案
- [ ] **SPAY-902** 更新 Terms / Privacy 中的订阅、退款、计费说明
- [ ] **SPAY-903** 明确一次性套餐与积分包的退款边界
- [ ] **SPAY-904** 明确多币种显示与最终扣费说明

### Phase 10：验证与部署

- [ ] **SPAY-1000** 为 Price 解析器写单元测试
- [ ] **SPAY-1001** 为 credits 三阶段事务写单元测试
- [ ] **SPAY-1002** 为 Webhook 幂等写单元测试
- [ ] **SPAY-1003** 为 `/api/billing/checkout` 与 `/api/webhooks/stripe` 写集成测试
- [ ] **SPAY-1004** 手测三类订单：自动月付 / 一次性套餐 / 积分包
- [ ] **SPAY-1005** 手测用户升级、降级、取消、续费、支付失败
- [ ] **SPAY-1006** 补齐生产环境 Stripe 密钥
- [ ] **SPAY-1007** 配置正式 Stripe Webhook 端点
- [ ] **SPAY-1008** 推送 `main` 触发 GitHub Actions 与 Cloudflare 生产部署

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
