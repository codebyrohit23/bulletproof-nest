import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailCode, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  code: z.string().min(1),

  expiresInMinutes: z.number().int().positive(),
});

/**
 * Separate from the user's reset email so an admin can tell at a glance which
 * account the code is for — the same person may hold both, at one address.
 */
export const adminPasswordResetTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.ADMIN_PASSWORD_RESET,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: (data) => `${data.code} is your ${EMAIL_BRAND.NAME} admin console password reset code`,

  component: (data) => (
    <EmailLayout preview={`${data.code} is your admin console password reset code`}>
      <EmailText>
        Use this code to set a new password for the {EMAIL_BRAND.NAME} admin console.
      </EmailText>

      <EmailCode value={data.code} />

      <EmailText muted>
        This code expires in {data.expiresInMinutes} minutes. If you did not request it, your
        password is unchanged — but someone knows your admin address, so tell whoever manages admin
        access.
      </EmailText>
    </EmailLayout>
  ),
};
