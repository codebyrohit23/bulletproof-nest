import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailCode, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  code: z.string().min(1),

  expiresInMinutes: z.number().int().positive(),
});

/**
 * A code, not a link.
 *
 * Every other flow in this service proves an identifier with a code, and
 * `VerificationPurpose.PASSWORD_RESET` is issued the same way as the rest. A
 * magic link here would need its own token, its own expiry and its own landing
 * route, to answer a question the existing mechanism already answers.
 */
export const passwordResetTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.PASSWORD_RESET,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: (data) => `${data.code} is your ${EMAIL_BRAND.NAME} password reset code`,

  component: (data) => (
    <EmailLayout preview={`${data.code} is your password reset code`}>
      <EmailText>Use this code to set a new password.</EmailText>

      <EmailCode value={data.code} />

      {/*
       * Deliberately firmer than the verification email. This message is the
       * one signal an account owner gets that someone is trying to take their
       * account, so it says what to do rather than "you can ignore this".
       */}
      <EmailText muted>
        This code expires in {data.expiresInMinutes} minutes. If you did not request a password
        reset, your password is unchanged — but someone knows your email address, so it is worth
        checking your account.
      </EmailText>
    </EmailLayout>
  ),
};
