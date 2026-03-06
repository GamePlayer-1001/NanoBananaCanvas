/**
 * [INPUT]: 无外部类型依赖 (Clerk appearance 结构体)
 * [OUTPUT]: 对外提供 authAppearance (Clerk 白色卡片主题定制)
 * [POS]: lib 的 Clerk 样式配置，被 sign-in/sign-up 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Auth Appearance ────────────────────────────────── */

export const authAppearance = {
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: '#ffffff',
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorInputBackground: '#ffffff',
    colorInputText: '#1e293b',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  elements: {
    /* 卡片容器 */
    card: {
      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2)',
      borderRadius: '0.75rem',
      border: 'none',
    },
    /* 头部 */
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
    },
    headerSubtitle: {
      display: 'none',
    },
    /* 社交按钮 */
    socialButtonsBlockButton: {
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      height: '44px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.15s ease',
    },
    socialButtonsBlockButtonText: {
      fontSize: '14px',
      fontWeight: '500',
    },
    /* 主按钮 */
    formButtonPrimary: {
      backgroundColor: '#6366f1',
      borderRadius: '0.5rem',
      height: '44px',
      fontSize: '14px',
      fontWeight: '500',
    },
    /* 表单输入 */
    formFieldInput: {
      borderRadius: '0.5rem',
      height: '44px',
      border: '1px solid #e2e8f0',
    },
    /* 底部链接区 */
    footerAction: {
      fontSize: '13px',
    },
    footerActionLink: {
      color: '#6366f1',
      fontWeight: '500',
    },
    /* 分隔线 */
    dividerLine: {
      background: '#e2e8f0',
    },
    dividerText: {
      color: '#94a3b8',
      fontSize: '12px',
    },
  },
}
