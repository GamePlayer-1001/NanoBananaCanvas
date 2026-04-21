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
  getCreditPackPriceEnvKey,
  getPlanPriceEnvKey,
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
        plan_auto_monthly: { usd: 'price_std_sub_usd', eur: 'price_std_sub_eur' },
        plan_one_time: { usd: 'price_std_one_usd' },
      },
      pro: {
        plan_auto_monthly: { usd: 'price_pro_sub_usd' },
        plan_one_time: { usd: 'price_pro_one_usd', cny: 'price_pro_one_cny' },
      },
      ultimate: {
        plan_auto_monthly: { usd: 'price_ult_sub_usd' },
        plan_one_time: { usd: 'price_ult_one_usd' },
      },
    },
    creditPackPrices: {
      '500': { usd: 'price_pack_500_usd' },
      '1200': { usd: 'price_pack_1200_usd', eur: 'price_pack_1200_eur' },
      '3500': { usd: 'price_pack_3500_usd' },
      '8000': { usd: 'price_pack_8000_usd' },
    },
  }
}

describe('billing config', () => {
  it('should build plan env keys with canonical naming', () => {
    expect(getPlanPriceEnvKey('standard', 'plan_auto_monthly', 'usd')).toBe(
      'STRIPE_PRICE_STANDARD_PLAN_AUTO_MONTHLY_USD',
    )
  })

  it('should build credit pack env keys with canonical naming', () => {
    expect(getCreditPackPriceEnvKey('1200', 'eur')).toBe(
      'STRIPE_PRICE_CREDIT_PACK_1200_EUR',
    )
  })

  it('should infer eur for euro-area countries', () => {
    expect(inferCurrencyFromCountry('DE')).toBe('eur')
  })

  it('should infer gbp for GB and cny for CN', () => {
    expect(inferCurrencyFromCountry('GB')).toBe('gbp')
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
      resolveBillingCurrency({ requestedCurrency: 'GBP', countryCode: 'DE' }),
    ).toBe('gbp')
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

  it('should resolve credit pack prices by package/currency', async () => {
    await expect(
      resolveStripePriceId(
        {
          purchaseMode: 'credit_pack',
          packageId: '1200',
          currency: 'eur',
        },
        createConfig(),
      ),
    ).resolves.toBe('price_pack_1200_eur')
  })

  it('should throw a unified error when the price is missing', async () => {
    await expect(
      resolveStripePriceId(
        {
          plan: 'standard',
          purchaseMode: 'plan_one_time',
          currency: 'eur',
        },
        createConfig(),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
    })
  })
})
