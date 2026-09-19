import { z } from 'zod';

import { EMAIL_BRAND, EMAIL_CATEGORY, EMAIL_TEMPLATE } from '../../../constants/index.js';
import type { EmailTemplate } from '../../../interfaces/index.js';
import { EmailButton, EmailLayout, EmailText } from '../../components/index.js';

const schema = z.object({
  firstName: z.string().min(1),

  method: z.enum(['changed', 'reset']),

  changedAt: z.iso.datetime(),

  signInUrl: z.url(),
});

/** UTC, stated as such: the time zone of whoever reads this is unknown. */
function formatChangedAt(iso: string): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));

  return `${formatted} UTC`;
}

/**
 * The account owner's one signal that a password changed without them.
 *
 * Carries no token-bearing link and nothing about where the change came from:
 * after a takeover this lands in a mailbox the attacker may also read, so it
 * tells the owner what to do and gives the attacker nothing to use.
 */
export const passwordChangedTemplate: EmailTemplate<z.infer<typeof schema>> = {
  id: EMAIL_TEMPLATE.PASSWORD_CHANGED,

  category: EMAIL_CATEGORY.TRANSACTIONAL,

  schema,

  subject: () => `Your ${EMAIL_BRAND.NAME} password was changed`,

  component: (data) => (
    <EmailLayout preview={`Your ${EMAIL_BRAND.NAME} password was changed`}>
      <EmailText>
        Hi {data.firstName}, the password for your {EMAIL_BRAND.NAME} account was{' '}
        {data.method === 'reset' ? 'reset' : 'changed'} on {formatChangedAt(data.changedAt)}.
      </EmailText>

      <EmailText>
        {data.method === 'reset'
          ? 'Every device that was signed in has been signed out.'
          : 'Every other device that was signed in has been signed out.'}
      </EmailText>

      <EmailText>If this was you, there is nothing else to do.</EmailText>

      <EmailButton href={data.signInUrl}>Secure your account</EmailButton>

      <EmailText muted>
        If you did not make this change, reset your password now — someone else may know it.
      </EmailText>
    </EmailLayout>
  ),
};
