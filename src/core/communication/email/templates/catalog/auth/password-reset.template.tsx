import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailCode, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  code: z.string().min(1),

  expiresInMinutes: z.number().int().positive(),
});

export const passwordResetTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.PASSWORD_RESET,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: (data) => `${data.code} is your ${EMAIL_BRAND.NAME} password reset code`,

  component: (data) => (
    <EmailLayout preview={`${data.code} is your password reset code`}>
      <EmailText>Use this code to set a new password.</EmailText>

      <EmailCode value={data.code} />

      <EmailText muted>
        This code expires in {data.expiresInMinutes} minutes. If you did not request a password
        reset, your password is unchanged — but someone knows your email address, so it is worth
        checking your account.
      </EmailText>
    </EmailLayout>
  ),
};
