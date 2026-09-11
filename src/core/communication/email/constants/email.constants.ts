export const EMAIL_JOB = {
  DELIVER: 'email.deliver',
} as const;

export type EmailJob = (typeof EMAIL_JOB)[keyof typeof EMAIL_JOB];

export const EMAIL_LOG_CONTEXT = 'Email';

export const EMAIL_BRAND = {
  NAME: 'LeadFlow',
  SUPPORT_URL: 'https://leadflow.local/support',
} as const;
