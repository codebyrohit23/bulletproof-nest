import type { EMAIL_TEMPLATE } from '#/core/communication/email/index.js';
import type { IdentifierInput } from '#/shared/schemas/index.js';

/**
 * Who a one-time code is for, in the three senses a code needs: the identity
 * it proves, the address it is sent to, and the user it is recorded against.
 *
 * One object rather than three parameters, because they must describe the same
 * identity — passed separately, a caller could send a code to one address and
 * file it under another.
 */
export interface CodeRecipient {
  readonly identityId: string;

  readonly userId: string;

  readonly identifier: IdentifierInput;
}

/** The templates that carry a one-time code. */
export type CodeEmailTemplate =
  | typeof EMAIL_TEMPLATE.OTP_VERIFICATION
  | typeof EMAIL_TEMPLATE.LOGIN_OTP
  | typeof EMAIL_TEMPLATE.PASSWORD_RESET;

/** How a password came to change — the notice words it differently. */
export type PasswordChangeMethod = 'changed' | 'reset';
