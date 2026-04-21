/**
 * [INPUT]: 依赖 @/lib/env 的 getEnv/requireEnv，依赖 @/lib/errors 的 BillingError/ErrorCode
 * [OUTPUT]: 对外提供 StripeBillingConfig、币种白名单/国家推断、环境变量键生成器与 resolveStripePriceId()
 * [POS]: lib/billing 的配置真相源，先把 Price 解析与币种策略锁进一个收口模块，再让后续 checkout/webhook 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getEnv, requireEnv } from '@/lib/env'
import { BillingError, ErrorCode } from '@/lib/errors'

export const BILLING_PLANS = ['standard', 'pro', 'ultimate'] as const
export const PLAN_PURCHASE_MODES = ['plan_auto_monthly', 'plan_one_time'] as const
export const BILLING_PURCHASE_MODES = [...PLAN_PURCHASE_MODES, 'credit_pack'] as const
export const CREDIT_PACK_IDS = ['500', '1200', '3500', '8000'] as const
export const BILLING_CURRENCIES = ['usd', 'eur', 'gbp', 'cny'] as const
export const DEFAULT_BILLING_CURRENCY = 'usd' as const

export type BillingPlan = (typeof BILLING_PLANS)[number]
export type PlanPurchaseMode = (typeof PLAN_PURCHASE_MODES)[number]
export type BillingPurchaseMode = (typeof BILLING_PURCHASE_MODES)[number]
export type CreditPackId = (typeof CREDIT_PACK_IDS)[number]
export type BillingCurrency = (typeof BILLING_CURRENCIES)[number]

export interface StripeBillingConfig {
  secretKey: string
  webhookSecret: string
  publishableKey?: string
  portalConfigurationId?: string
  defaultCurrency: BillingCurrency
  planPrices: Record<
    BillingPlan,
    Record<PlanPurchaseMode, Partial<Record<BillingCurrency, string>>>
  >
  creditPackPrices: Record<CreditPackId, Partial<Record<BillingCurrency, string>>>
}

export interface ResolveStripePriceIdInput {
  purchaseMode: BillingPurchaseMode
  plan?: BillingPlan
  packageId?: CreditPackId
  currency: BillingCurrency
}

const EURO_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR',
  'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL',
  'PT', 'RO', 'SE', 'SI', 'SK',
])

function isBillingPlan(value: string): value is BillingPlan {
  return (BILLING_PLANS as readonly string[]).includes(value)
}

function isPlanPurchaseMode(value: string): value is PlanPurchaseMode {
  return (PLAN_PURCHASE_MODES as readonly string[]).includes(value)
}

function isCreditPackId(value: string): value is CreditPackId {
  return (CREDIT_PACK_IDS as readonly string[]).includes(value)
}

function isBillingCurrency(value: string): value is BillingCurrency {
  return (BILLING_CURRENCIES as readonly string[]).includes(value)
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function normalizeBillingCurrency(value: string | null | undefined): BillingCurrency | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return isBillingCurrency(normalized) ? normalized : null
}

export function inferCurrencyFromCountry(countryCode: string | null | undefined): BillingCurrency {
  const normalized = countryCode?.trim().toUpperCase()

  if (!normalized) {
    return DEFAULT_BILLING_CURRENCY
  }

  if (normalized === 'GB') {
    return 'gbp'
  }

  if (normalized === 'CN') {
    return 'cny'
  }

  if (EURO_COUNTRY_CODES.has(normalized)) {
    return 'eur'
  }

  return DEFAULT_BILLING_CURRENCY
}

export function resolveBillingCurrency(options: {
  requestedCurrency?: string | null
  countryCode?: string | null
}): BillingCurrency {
  const requested = options.requestedCurrency?.trim()

  if (requested) {
    const normalized = normalizeBillingCurrency(requested)
    if (!normalized) {
      throw new BillingError(
        ErrorCode.BILLING_CURRENCY_UNSUPPORTED,
        `Unsupported billing currency: ${requested}`,
        { requestedCurrency: requested, supportedCurrencies: BILLING_CURRENCIES },
      )
    }

    return normalized
  }

  return inferCurrencyFromCountry(options.countryCode)
}

export function getPlanPriceEnvKey(
  plan: BillingPlan,
  purchaseMode: PlanPurchaseMode,
  currency: BillingCurrency,
): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${purchaseMode.toUpperCase()}_${currency.toUpperCase()}`
}

export function getCreditPackPriceEnvKey(
  packageId: CreditPackId,
  currency: BillingCurrency,
): string {
  return `STRIPE_PRICE_CREDIT_PACK_${packageId}_${currency.toUpperCase()}`
}

async function getOptionalEnv(key: string): Promise<string | undefined> {
  return normalizeEnvValue(await getEnv(key))
}

async function readPlanPrices(): Promise<StripeBillingConfig['planPrices']> {
  const result = {} as StripeBillingConfig['planPrices']

  for (const plan of BILLING_PLANS) {
    result[plan] = {} as StripeBillingConfig['planPrices'][BillingPlan]

    for (const purchaseMode of PLAN_PURCHASE_MODES) {
      const byCurrency: Partial<Record<BillingCurrency, string>> = {}

      for (const currency of BILLING_CURRENCIES) {
        const envKey = getPlanPriceEnvKey(plan, purchaseMode, currency)
        const priceId = await getOptionalEnv(envKey)
        if (priceId) {
          byCurrency[currency] = priceId
        }
      }

      result[plan][purchaseMode] = byCurrency
    }
  }

  return result
}

async function readCreditPackPrices(): Promise<StripeBillingConfig['creditPackPrices']> {
  const result = {} as StripeBillingConfig['creditPackPrices']

  for (const packageId of CREDIT_PACK_IDS) {
    const byCurrency: Partial<Record<BillingCurrency, string>> = {}

    for (const currency of BILLING_CURRENCIES) {
      const envKey = getCreditPackPriceEnvKey(packageId, currency)
      const priceId = await getOptionalEnv(envKey)
      if (priceId) {
        byCurrency[currency] = priceId
      }
    }

    result[packageId] = byCurrency
  }

  return result
}

export async function getStripeBillingConfig(): Promise<StripeBillingConfig> {
  const defaultCurrency = resolveBillingCurrency({
    requestedCurrency: await getOptionalEnv('STRIPE_DEFAULT_CURRENCY'),
  })

  return {
    secretKey: await requireEnv('STRIPE_SECRET_KEY'),
    webhookSecret: await requireEnv('STRIPE_WEBHOOK_SECRET'),
    publishableKey: await getOptionalEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    portalConfigurationId: await getOptionalEnv('STRIPE_PORTAL_CONFIGURATION_ID'),
    defaultCurrency,
    planPrices: await readPlanPrices(),
    creditPackPrices: await readCreditPackPrices(),
  }
}

function assertPlanPurchaseMode(purchaseMode: BillingPurchaseMode): PlanPurchaseMode {
  if (!isPlanPurchaseMode(purchaseMode)) {
    throw new BillingError(
      ErrorCode.BILLING_PURCHASE_MODE_INVALID,
      `Invalid plan purchase mode: ${purchaseMode}`,
      { purchaseMode, allowedPurchaseModes: PLAN_PURCHASE_MODES },
    )
  }

  return purchaseMode
}

function assertBillingPlan(plan: BillingPlan | undefined): BillingPlan {
  if (!plan || !isBillingPlan(plan)) {
    throw new BillingError(
      ErrorCode.BILLING_PLAN_INVALID,
      'Billing plan is required for plan purchases',
      { plan, allowedPlans: BILLING_PLANS },
    )
  }

  return plan
}

function assertCreditPackId(packageId: CreditPackId | undefined): CreditPackId {
  if (!packageId || !isCreditPackId(packageId)) {
    throw new BillingError(
      ErrorCode.BILLING_PACKAGE_INVALID,
      'Credit pack id is required for credit pack purchases',
      { packageId, allowedPackageIds: CREDIT_PACK_IDS },
    )
  }

  return packageId
}

export async function resolveStripePriceId(
  input: ResolveStripePriceIdInput,
  config?: StripeBillingConfig,
): Promise<string> {
  const resolvedConfig = config ?? (await getStripeBillingConfig())

  if (!isBillingCurrency(input.currency)) {
    throw new BillingError(
      ErrorCode.BILLING_CURRENCY_UNSUPPORTED,
      `Unsupported billing currency: ${input.currency}`,
      { currency: input.currency, supportedCurrencies: BILLING_CURRENCIES },
    )
  }

  if (input.purchaseMode === 'credit_pack') {
    const packageId = assertCreditPackId(input.packageId)
    const priceId = resolvedConfig.creditPackPrices[packageId]?.[input.currency]

    if (!priceId) {
      throw new BillingError(
        ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
        'Stripe price is not configured for the requested credit pack/currency pair',
        { purchaseMode: input.purchaseMode, packageId, currency: input.currency },
      )
    }

    return priceId
  }

  const plan = assertBillingPlan(input.plan)
  const purchaseMode = assertPlanPurchaseMode(input.purchaseMode)
  const priceId = resolvedConfig.planPrices[plan]?.[purchaseMode]?.[input.currency]

  if (!priceId) {
    throw new BillingError(
      ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
      'Stripe price is not configured for the requested plan/mode/currency tuple',
      { plan, purchaseMode, currency: input.currency },
    )
  }

  return priceId
}
