import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailButton, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  firstName: z.string().min(1),

  dashboardUrl: z.url(),
});

/**
 * Transactional, not marketing, even though it is the friendliest email here.
 *
 * It is sent once, in direct response to finishing signup, and a user who
 * unsubscribed from marketing still needs it. Categorising it as marketing would
 * put it behind the suppression list and on the bulk sending domain, where it
 * would arrive late or not at all.
 */
export const welcomeTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.WELCOME,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: () => `Welcome to ${EMAIL_BRAND.NAME}`,

  component: (data) => (
    <EmailLayout preview={`Your ${EMAIL_BRAND.NAME} account is ready`}>
      <EmailText>Hi {data.firstName}, your account is ready.</EmailText>

      <EmailText>
        Add your first leads, invite your team, and set up the pipeline stages your business
        actually uses.
      </EmailText>

      <EmailButton href={data.dashboardUrl}>Open your dashboard</EmailButton>

      <EmailText muted>
        Need a hand getting started? Reply to this email and someone will help.
      </EmailText>
    </EmailLayout>
  ),
};
