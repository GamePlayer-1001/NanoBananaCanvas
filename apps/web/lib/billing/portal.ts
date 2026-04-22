/**
 * [INPUT]: 依赖 ./config、./stripe-client
 * [OUTPUT]: 对外提供 createPortalSession()，返回 Stripe Customer Portal URL
 * [POS]: lib/billing 的 Portal 编排层，负责把已登录用户翻译成 Stripe Customer Portal Session
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BillingError, ErrorCode } from '@/lib/errors'

import { getStripeBillingConfig } from './config'
import { withStripeErrorMapping } from './stripe-error'
import { getOrCreateStripeCustomer, getStripe, requireAppBaseUrl } from './stripe-client'

export interface PortalSessionResult {
  portalUrl: string
}

function buildPortalReturnUrl(appUrl: string): string {
  return `${appUrl}/account?billing=portal_return`
}

export async function createPortalSession(userId: string): Promise<PortalSessionResult> {
  const stripe = await getStripe()
  const appUrl = await requireAppBaseUrl()
  const customer = await getOrCreateStripeCustomer(userId)
  const billingConfig = await getStripeBillingConfig()

  if (!billingConfig.portalConfigurationId) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Stripe portal configuration is not configured',
      { envKey: 'STRIPE_PORTAL_CONFIGURATION_ID' },
    )
  }

  const session = await withStripeErrorMapping('opening billing portal', () =>
    stripe.billingPortal.sessions.create({
      customer: customer.customerId,
      configuration: billingConfig.portalConfigurationId,
      return_url: buildPortalReturnUrl(appUrl),
    }),
  )

  return {
    portalUrl: session.url,
  }
}
