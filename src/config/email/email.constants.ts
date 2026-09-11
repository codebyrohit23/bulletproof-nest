export const EMAIL_DRIVER = {
  RESEND: 'resend',
  LOG: 'log',
} as const;

export type EmailDriver = (typeof EMAIL_DRIVER)[keyof typeof EMAIL_DRIVER];

export const EMAIL_SETTINGS = {
  TIMEOUT_MS: 10000,

  RESEND_BASE_URL: 'https://api.resend.com',
} as const;

export const RESEND_API_KEY_PREFIX = 're_';
