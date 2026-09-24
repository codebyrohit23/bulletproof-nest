import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailCode, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  code: z.string().min(1),

  expiresInMinutes: z.number().int().positive(),
});

export const otpVerificationTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.OTP_VERIFICATION,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: (data) => `${data.code} is your ${EMAIL_BRAND.NAME} verification code`,

  component: (data) => (
    <EmailLayout preview={`${data.code} is your verification code`}>
      <EmailText>Use this code to verify your email address.</EmailText>

      <EmailCode value={data.code} />

      <EmailText muted>
        This code expires in {data.expiresInMinutes} minutes. If you did not ask for it, you can
        ignore this email.
      </EmailText>
    </EmailLayout>
  ),
};
