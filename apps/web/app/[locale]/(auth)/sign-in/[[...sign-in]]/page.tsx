/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations / setRequestLocale，依赖 @/components/auth/auth-shell
 * [OUTPUT]: 对外提供登录页路由
 * [POS]: (auth) 路由组的登录页入口，当前承载 Martini 风格登录界面壳层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/auth-shell'

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <AuthShell
      mode="sign-in"
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      ctaLabel={t('login')}
      switchLabel={t('noAccount')}
      switchHref="/sign-up"
      switchText={t('register')}
      t={{
        brandName: t('brandName'),
        visualEyebrow: t('visualEyebrow'),
        visualHeadline: t('visualHeadline'),
        visualDescription: t('visualDescription'),
        visualPointOne: t('visualPointOne'),
        visualPointTwo: t('visualPointTwo'),
        visualPointThree: t('visualPointThree'),
        emailLabel: t('emailLabel'),
        emailPlaceholder: t('emailPlaceholder'),
        passwordLabel: t('passwordLabel'),
        passwordPlaceholder: t('passwordPlaceholder'),
        forgotPassword: t('forgotPassword'),
        divider: t('divider'),
        continueWithGoogle: t('continueWithGoogle'),
        continueWithGithub: t('continueWithGithub'),
        termsPrefix: t('termsPrefix'),
        termsLink: t('termsLink'),
        and: t('and'),
        privacyLink: t('privacyLink'),
        previewHint: t('previewHint'),
      }}
    />
  )
}
