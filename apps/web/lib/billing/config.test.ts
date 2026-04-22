/**
 * [INPUT]: 依赖 vitest，依赖 ./config，依赖 @/lib/errors
 * [OUTPUT]: 对外提供 Stripe 计费配置测试，覆盖币种推断、Price 解析与统一错误码
 * [POS]: lib/billing 的配置守卫测试，确保计费入口先把语义分支收口在纯函数层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { BillingError, ErrorCode } from '@/lib/errors'

import {
  type StripeBillingConfig,
  getPlanPriceEnvKey,
  getPlanPriceCurrencyEnvKey,
  getCreditPackPriceEnvKey,
  getCreditPackPriceCurrencyEnvKey,
  inferCurrencyFromCountry,
  resolveBillingCurrency,
  resolveStripePriceId,
} from './config'

function createConfig(): StripeBillingConfig {
  return {
    secretKey: 'sk_test',
    webhookSecret: 'whsec_test',
    publishableKey: 'pk_test',
    portalConfigurationId: 'bpc_test',
    defaultCurrency: 'usd',
    planPrices: {
      standard: {
        plan_auto_monthly: {
          defaultPriceId: 'price_std_sub_multi',
          byCurrency: { usd: 'price_std_sub_usd', cny: 'price_std_sub_cny' },
        },
        plan_one_time: {
          byCurrency: { usd: 'price_std_one_usd' },
        },
      },
      pro: {
        plan_auto_monthly: {
          defaultPriceId: 'price_pro_sub_multi',
          byCurrency: { usd: 'price_pro_sub_usd' },
        },
        plan_one_time: {
          byCurrency: { usd: 'price_pro_one_usd', cny: 'price_pro_one_cny' },
        },
      },
      ultimate: {
        plan_auto_monthly: {
          defaultPriceId: 'price_ult_sub_multi',
          byCurrency: { usd: 'price_ult_sub_usd' },
        },
        plan_one_time: {
          byCurrency: { usd: 'price_ult_one_usd' },
        },
      },
    },
    creditPackPrices: {
      '500': { byCurrency: { usd: 'price_pack_500_usd' } },
      '1200': { byCurrency: { usd: 'price_pack_1200_usd', cny: 'price_pack_1200_cny' } },
      '3500': { byCurrency: { usd: 'price_pack_3500_usd' } },
      '8000': { byCurrency: { usd: 'price_pack_8000_usd' } },
    },
  }
}

describe('billing config', () => {
  it('should build shared plan env keys with canonical naming', () => {
    expect(getPlanPriceEnvKey('standard', 'plan_auto_monthly')).toBe(
      'STRIPE_PRICE_STANDARD_PLAN_AUTO_MONTHLY',
    )
  })

  it('should build currency plan env keys with canonical naming', () => {
    expect(getPlanPriceCurrencyEnvKey('standard', 'plan_auto_monthly', 'usd')).toBe(
      'STRIPE_PRICE_STANDARD_PLAN_AUTO_MONTHLY_USD',
    )
  })

  it('should build shared credit pack env keys with canonical naming', () => {
    expect(getCreditPackPriceEnvKey('1200')).toBe(
      'STRIPE_PRICE_CREDIT_PACK_1200',
    )
  })

  it('should build currency credit pack env keys with canonical naming', () => {
    expect(getCreditPackPriceCurrencyEnvKey('1200', 'cny')).toBe(
      'STRIPE_PRICE_CREDIT_PACK_1200_CNY',
    )
  })

  it('should infer cny for CN and usd for all other regions', () => {
    expect(inferCurrencyFromCountry('GB')).toBe('usd')
    expect(inferCurrencyFromCountry('DE')).toBe('usd')
    expect(inferCurrencyFromCountry('CN')).toBe('cny')
  })

  it('should fall back to usd when no country is available', () => {
    expect(inferCurrencyFromCountry(undefined)).toBe('usd')
  })

  it('should reject unsupported requested currencies', () => {
    expect(() =>
      resolveBillingCurrency({ requestedCurrency: 'jpy' }),
    ).toThrowError(BillingError)

    expect(() =>
      resolveBillingCurrency({ requestedCurrency: 'jpy' }),
    ).toThrowError(
      expect.objectContaining({ code: ErrorCode.BILLING_CURRENCY_UNSUPPORTED }),
    )
  })

  it('should prefer an explicit supported requested currency', () => {
    expect(
      resolveBillingCurrency({ requestedCurrency: 'CNY', countryCode: 'DE' }),
    ).toBe('cny')
  })

  it('should resolve plan prices by plan/mode/currency', async () => {
    await expect(
      resolveStripePriceId(
        {
          plan: 'pro',
          purchaseMode: 'plan_one_time',
          currency: 'cny',
        },
        createConfig(),
      ),
    ).resolves.toBe('price_pro_one_cny')
  })

  it('should fall back to a shared multi-currency price id when present', async () => {
    await expect(
      resolveStripePriceId(
        {
          plan: 'standard',
          purchaseMode: 'plan_auto_monthly',
          currency: 'cny',
        },
        createConfig(),
      ),
    ).resolves.toBe('price_std_sub_multi')
  })

  it('should resolve credit pack prices by package/currency', async () => {
    await expect(
      resolveStripePriceId(
        {
          purchaseMode: 'credit_pack',
          packageId: '1200',
          currency: 'cny',
        },
        createConfig(),
      ),
    ).resolves.toBe('price_pack_1200_cny')
  })

  it('should throw a unified error when the price is missing', async () => {
    await expect(
      resolveStripePriceId(
        {
          plan: 'standard',
          purchaseMode: 'plan_one_time',
          currency: 'cny',
        },
        createConfig(),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
    })
  })

  it('should reject invalid plan purchase modes before reading plan prices', async () => {
    await expect(
      resolveStripePriceId(
        {
          plan: 'standard',
          purchaseMode: 'credit_pack',
          currency: 'usd',
        },
        createConfig(),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_PACKAGE_INVALID,
    })
  })

  it('should reject missing credit pack ids for credit pack purchases', async () => {
    await expect(
      resolveStripePriceId(
        {
          purchaseMode: 'credit_pack',
          currency: 'usd',
        },
        createConfig(),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_PACKAGE_INVALID,
    })
  })

  it('should reject unsupported currencies at the price resolver boundary', async () => {
    await expect(
      resolveStripePriceId(
        {
          plan: 'standard',
          purchaseMode: 'plan_auto_monthly',
          currency: 'jpy' as never,
        },
        createConfig(),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_CURRENCY_UNSUPPORTED,
    })
  })

  it('should reject missing plan metadata for plan purchases', async () => {
    await expect(
      resolveStripePriceId(
        {
          purchaseMode: 'plan_auto_monthly',
          currency: 'usd',
        },
        createConfig(),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_PLAN_INVALID,
    })
  })
})
