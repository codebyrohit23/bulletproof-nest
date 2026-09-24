/**
 * A template id is data, not a label: it travels in queued job payloads, where
 * the worker resolves it at send time, and is stored in
 * `outbound_messages.template_key`. Renaming one strands any job already
 * queued under the old id and splits the history in two.
 *
 * So the user templates keep `auth.*` although their folder is now
 * `catalog/user-auth/` — they shipped under that id. New ids take the folder's
 * name, as the admin ones do.
 */
export const EMAIL_TEMPLATE = {
  OTP_VERIFICATION: 'auth.otp-verification',
  LOGIN_OTP: 'auth.login-otp',
  PASSWORD_RESET: 'auth.password-reset',
  WELCOME: 'auth.welcome',
  PASSWORD_CHANGED: 'auth.password-changed',

  ADMIN_PASSWORD_RESET: 'admin-auth.password-reset',

  ADMIN_PASSWORD_CHANGED: 'admin-auth.password-changed',
} as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE)[keyof typeof EMAIL_TEMPLATE];

export const EMAIL_CATEGORY = {
  TRANSACTIONAL: 'transactional',
  MARKETING: 'marketing',
} as const;

export type EmailCategory = (typeof EMAIL_CATEGORY)[keyof typeof EMAIL_CATEGORY];
