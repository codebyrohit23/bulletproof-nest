import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import {
  EmailButton,
  EmailLayout,
  EmailText,
  formatEmailDateTime,
} from '../../components/index.js';

const schema = z.object({
  firstName: z.string().min(1),

  method: z.enum(['changed', 'reset']),

  changedAt: z.iso.datetime(),

  /** The admin console — `ADMIN_WEB_APP_URL`, never the user app. */
  signInUrl: z.url(),
});

export const adminPasswordChangedTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.ADMIN_AUTH.PASSWORD_CHANGED,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: () => `Your ${EMAIL_BRAND.NAME} admin console password was changed`,

  component: (data) => (
    <EmailLayout preview={`Your ${EMAIL_BRAND.NAME} admin console password was changed`}>
      <EmailText>
        Hi {data.firstName}, the password for your {EMAIL_BRAND.NAME} admin console account was{' '}
        {data.method === 'reset' ? 'reset' : 'changed'} on {formatEmailDateTime(data.changedAt)}.
      </EmailText>

      <EmailText>
        {data.method === 'reset'
          ? 'Every device that was signed in to the console has been signed out.'
          : 'Every other device that was signed in to the console has been signed out.'}
      </EmailText>

      <EmailText>If this was you, there is nothing else to do.</EmailText>

      <EmailButton href={data.signInUrl}>Sign in to the admin console</EmailButton>

      <EmailText muted>
        If you did not make this change, tell whoever manages admin access at once — someone else
        may hold your password.
      </EmailText>
    </EmailLayout>
  ),
};
