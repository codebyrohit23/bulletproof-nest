import type { EMAIL_TEMPLATE } from '#/core/communication/email/index.js';

/** The templates that carry an admin's one-time code. Two-factor sign-in adds one. */
export type AdminCodeEmailTemplate = typeof EMAIL_TEMPLATE.ADMIN_AUTH.PASSWORD_RESET_CODE;

/** How an admin's password came to change — the notice words it differently. */
export type AdminPasswordChangeMethod = 'changed' | 'reset';
