export const EMAIL_TEMPLATE = {
  OTP_VERIFICATION: 'auth.otp-verification',
  LOGIN_OTP: 'auth.login-otp',
  PASSWORD_RESET: 'auth.password-reset',
  WELCOME: 'auth.welcome',
  PASSWORD_CHANGED: 'auth.password-changed',
} as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE)[keyof typeof EMAIL_TEMPLATE];

export const EMAIL_CATEGORY = {
  TRANSACTIONAL: 'transactional',
  MARKETING: 'marketing',
} as const;

export type EmailCategory = (typeof EMAIL_CATEGORY)[keyof typeof EMAIL_CATEGORY];
