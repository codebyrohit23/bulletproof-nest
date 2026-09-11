import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailCode, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  code: z.string().min(1),

  expiresInMinutes: z.number().int().positive(),
});

/**
 * Signing in, not proving an address.
 *
 * Separate from `OTP_VERIFICATION` even though the data is identical, because
 * the copy is the whole point of the email: one asks someone to confirm an
 * address they just gave you, the other lets them into an account that already
 * exists. Sharing a template would mean mailing "verify your email address" to
 * someone who is logging in — confusing at best, and it trains people to type
 * codes into whatever asks for them.
 */
export const loginOtpTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.LOGIN_OTP,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: (data) => `${data.code} is your ${EMAIL_BRAND.NAME} sign-in code`,

  component: (data) => (
    <EmailLayout preview={`${data.code} is your sign-in code`}>
      <EmailText>Use this code to sign in to your account.</EmailText>

      <EmailCode value={data.code} />

      {/*
       * The warning is sharper than the verification email's "you can ignore
       * this", because this code opens an account rather than confirming an
       * address. Naming the attack — someone asking you to read it out — is
       * what stops it, since the scam depends on the code sounding harmless.
       */}
      <EmailText muted>
        This code expires in {data.expiresInMinutes} minutes. {EMAIL_BRAND.NAME} will never ask you
        for it. If you did not try to sign in, do not share this code with anyone.
      </EmailText>
    </EmailLayout>
  ),
};
