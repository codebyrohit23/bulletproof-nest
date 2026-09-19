import type { EMAIL_TEMPLATE } from '#/core/communication/email/index.js';

/** The templates that carry a one-time code. */
export type CodeEmailTemplate =
  | typeof EMAIL_TEMPLATE.OTP_VERIFICATION
  | typeof EMAIL_TEMPLATE.LOGIN_OTP
  | typeof EMAIL_TEMPLATE.PASSWORD_RESET;
