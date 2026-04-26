/**
 * [INPUT]: 依赖 stripe SDK，依赖 @/lib/env 的 getEnv/requireEnv，依赖 @/lib/errors 的 BillingError/ErrorCode
 * [OUTPUT]: 对外提供 StripeBillingConfig、币种白名单/国家推断、环境变量键生成器、lookup_key 生成器与 resolveStripePriceId()
 * [POS]: lib/billing 的配置真相源，兼容“单 Price 多币种”、“按币种拆 Price”与 lookup_key 动态回退三种 Stripe 建模方式
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Stripe from 'stripe'

import { getEnv, requireEnv } from '@/lib/env'
import { BillingError, ErrorCode } from '@/lib/errors'

export const BILLING_PLANS = ['standard', 'pro', 'ultimate'] as const
export const PLAN_PURCHASE_MODES = ['plan_auto_monthly', 'plan_one_time'] as const
export const BILLING_PURCHASE_MODES = [...PLAN_PURCHASE_MODES, 'credit_pack'] as const
export const CREDIT_PACK_IDS = ['500', '1200', '3500', '8000'] as const
export const BILLING_CURRENCIES = ['usd', 'cny'] as const
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
    Record<
      PlanPurchaseMode,
      {
        defaultPriceId?: string
        byCurrency: Partial<Record<BillingCurrency, string>>
      }
    >
  >
  creditPackPrices: Record<
    CreditPackId,
    {
      defaultPriceId?: string
      byCurrency: Partial<Record<BillingCurrency, string>>
    }
  >
}

export interface ResolveStripePriceIdInput {
  purchaseMode: BillingPurchaseMode
  plan?: BillingPlan
  packageId?: CreditPackId
  currency: BillingCurrency
}

interface ResolveStripePriceIdOptions {
  lookupPriceId?: (lookupKey: string) => Promise<string | undefined>
}

const stripeLookupCache = new Map<string, string>()

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

  if (normalized === 'CN') {
    return 'cny'
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
): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${purchaseMode.toUpperCase()}`
}

export function getPlanPriceCurrencyEnvKey(
  plan: BillingPlan,
  purchaseMode: PlanPurchaseMode,
  currency: BillingCurrency,
): string {
  return `${getPlanPriceEnvKey(plan, purchaseMode)}_${currency.toUpperCase()}`
}

export function getCreditPackPriceEnvKey(
  packageId: CreditPackId,
): string {
  return `STRIPE_PRICE_CREDIT_PACK_${packageId}`
}

export function getCreditPackPriceCurrencyEnvKey(
  packageId: CreditPackId,
  currency: BillingCurrency,
): string {
  return `${getCreditPackPriceEnvKey(packageId)}_${currency.toUpperCase()}`
}

export function getPlanPriceLookupKey(
  plan: BillingPlan,
  purchaseMode: PlanPurchaseMode,
): string {
  return `${plan}.${purchaseMode}`
}

export function getCreditPackPriceLookupKey(
  packageId: CreditPackId,
): string {
  return `credit_pack.${packageId}`
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
      const defaultPriceId = await getOptionalEnv(getPlanPriceEnvKey(plan, purchaseMode))

      for (const currency of BILLING_CURRENCIES) {
        const envKey = getPlanPriceCurrencyEnvKey(plan, purchaseMode, currency)
        const priceId = await getOptionalEnv(envKey)
        if (priceId) {
          byCurrency[currency] = priceId
        }
      }

      result[plan][purchaseMode] = {
        defaultPriceId,
        byCurrency,
      }
    }
  }

  return result
}

async function readCreditPackPrices(): Promise<StripeBillingConfig['creditPackPrices']> {
  const result = {} as StripeBillingConfig['creditPackPrices']

  for (const packageId of CREDIT_PACK_IDS) {
    const byCurrency: Partial<Record<BillingCurrency, string>> = {}
    const defaultPriceId = await getOptionalEnv(getCreditPackPriceEnvKey(packageId))

    for (const currency of BILLING_CURRENCIES) {
      const envKey = getCreditPackPriceCurrencyEnvKey(packageId, currency)
      const priceId = await getOptionalEnv(envKey)
      if (priceId) {
        byCurrency[currency] = priceId
      }
    }

    result[packageId] = {
      defaultPriceId,
      byCurrency,
    }
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

async function resolveStripePriceIdByLookupKey(lookupKey: string): Promise<string | undefined> {
  const cached = stripeLookupCache.get(lookupKey)
  if (cached) {
    return cached
  }

  const secretKey = await getEnv('STRIPE_SECRET_KEY')
  if (!secretKey?.trim()) {
    return undefined
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  })

  const response = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  })

  const matchedPriceId = response.data[0]?.id
  if (matchedPriceId) {
    stripeLookupCache.set(lookupKey, matchedPriceId)
  }

  return matchedPriceId
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
  options?: ResolveStripePriceIdOptions,
): Promise<string> {
  const resolvedConfig = config ?? (await getStripeBillingConfig())
  const resolveLookupPriceId = options?.lookupPriceId ?? resolveStripePriceIdByLookupKey

  if (!isBillingCurrency(input.currency)) {
    throw new BillingError(
      ErrorCode.BILLING_CURRENCY_UNSUPPORTED,
      `Unsupported billing currency: ${input.currency}`,
      { currency: input.currency, supportedCurrencies: BILLING_CURRENCIES },
    )
  }

  if (input.purchaseMode === 'credit_pack') {
    const packageId = assertCreditPackId(input.packageId)
    const bucket = resolvedConfig.creditPackPrices[packageId]
    const priceId = bucket?.byCurrency[input.currency] ?? bucket?.defaultPriceId

    if (priceId) {
      return priceId
    }

    const lookupPriceId = await resolveLookupPriceId(
      getCreditPackPriceLookupKey(packageId),
    )

    if (lookupPriceId) {
      return lookupPriceId
    }

    throw new BillingError(
      ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
      'Stripe price is not configured for the requested credit pack',
      {
        purchaseMode: input.purchaseMode,
        packageId,
        currency: input.currency,
        lookupKey: getCreditPackPriceLookupKey(packageId),
      },
    )
  }

  const plan = assertBillingPlan(input.plan)
  const purchaseMode = assertPlanPurchaseMode(input.purchaseMode)
  const bucket = resolvedConfig.planPrices[plan]?.[purchaseMode]
  const priceId = bucket?.byCurrency[input.currency] ?? bucket?.defaultPriceId

  if (priceId) {
    return priceId
  }

  const lookupKey = getPlanPriceLookupKey(plan, purchaseMode)
  const lookupPriceId = await resolveLookupPriceId(lookupKey)

  if (lookupPriceId) {
    return lookupPriceId
  }

  throw new BillingError(
    ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
    'Stripe price is not configured for the requested plan/mode',
    { plan, purchaseMode, currency: input.currency, lookupKey },
  )
}
