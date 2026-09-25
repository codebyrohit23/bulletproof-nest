export const EMAIL_TEMPLATE = {
  USER_AUTH: {
    VERIFICATION_CODE: 'user-auth.verification-code',

    LOGIN_CODE: 'user-auth.login-code',

    PASSWORD_RESET_CODE: 'user-auth.password-reset-code',

    WELCOME: 'user-auth.welcome',

    PASSWORD_CHANGED: 'user-auth.password-changed',
  },

  ADMIN_AUTH: {
    PASSWORD_RESET_CODE: 'admin-auth.password-reset-code',

    PASSWORD_CHANGED: 'admin-auth.password-changed',
  },
} as const;

export type EmailTemplateId = {
  [G in keyof typeof EMAIL_TEMPLATE]: (typeof EMAIL_TEMPLATE)[G][keyof (typeof EMAIL_TEMPLATE)[G]];
}[keyof typeof EMAIL_TEMPLATE];

export const EMAIL_CATEGORY = {
  TRANSACTIONAL: 'transactional',
  MARKETING: 'marketing',
} as const;

export type EmailCategory = (typeof EMAIL_CATEGORY)[keyof typeof EMAIL_CATEGORY];
