import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { SecurityConfig } from './security.interface.js';

export const securityConfig = registerAs('security', (): SecurityConfig => ({
  cookie: {
    secret: env.COOKIE_SECRET,
  },

  cors: {
    enabled: env.CORS_ENABLED,
    origin: env.CORS_ORIGINS,
    credentials: env.CORS_CREDENTIALS,
  },

  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED,
  },

  csrf: {
    enabled: env.CSRF_ENABLED,
  },
}));
