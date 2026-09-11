import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { EmailConfig } from './email.interface.js';

export const emailConfig = registerAs('email', (): EmailConfig => ({
  driver: env.EMAIL_DRIVER,

  timeoutMs: env.EMAIL_TIMEOUT_MS,

  from: {
    address: env.EMAIL_FROM_ADDRESS,

    name: env.EMAIL_FROM_NAME,
  },

  ...(env.EMAIL_REPLY_TO !== undefined ? { replyTo: env.EMAIL_REPLY_TO } : {}),

  ...(env.EMAIL_TEST_REDIRECT_TO !== undefined
    ? { testRedirectTo: env.EMAIL_TEST_REDIRECT_TO }
    : {}),

  resend: {
    apiKey: env.RESEND_API_KEY,

    baseUrl: env.RESEND_BASE_URL,

    ...(env.RESEND_WEBHOOK_SECRET !== undefined
      ? { webhookSecret: env.RESEND_WEBHOOK_SECRET }
      : {}),
  },
}));
