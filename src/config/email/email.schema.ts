import { z } from 'zod';

import { optionalEnv, positiveIntEnv } from '../shared/index.js';

import { EMAIL_DRIVER, EMAIL_SETTINGS, RESEND_API_KEY_PREFIX } from './email.constants.js';

export const emailSchema = z.object({
  EMAIL_DRIVER: z.enum(EMAIL_DRIVER),

  EMAIL_TIMEOUT_MS: positiveIntEnv(EMAIL_SETTINGS.TIMEOUT_MS),

  RESEND_API_KEY: z.string().startsWith(RESEND_API_KEY_PREFIX),

  RESEND_BASE_URL: z.url().default(EMAIL_SETTINGS.RESEND_BASE_URL),

  EMAIL_FROM_ADDRESS: z.email(),

  EMAIL_FROM_NAME: z.string().min(1),

  EMAIL_REPLY_TO: optionalEnv(z.email()),

  RESEND_WEBHOOK_SECRET: optionalEnv(z.string().min(1)),

  EMAIL_TEST_REDIRECT_TO: optionalEnv(z.email()),
});
