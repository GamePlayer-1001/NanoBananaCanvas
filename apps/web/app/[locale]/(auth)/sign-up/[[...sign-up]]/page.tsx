/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations / setRequestLocale，依赖 @/components/auth/auth-shell
 * [OUTPUT]: 对外提供注册页路由
 * [POS]: (auth) 路由组的注册页入口，复用认证双栏壳层保持风格一致
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/auth-shell'

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <AuthShell
      mode="sign-up"
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      ctaLabel={t('register')}
      switchLabel={t('alreadyHaveAccount')}
      switchHref="/sign-in"
      switchText={t('login')}
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
