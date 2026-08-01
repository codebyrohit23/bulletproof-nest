import { z } from 'zod';

import { booleanEnv, nonNegativeIntEnv, positiveIntEnv } from '../shared/schema.helpers.js';

import { REDIS_DEFAULTS, REDIS_KEY_PREFIX_PATTERN, REDIS_KEY_SEPARATOR } from './redis.constants.js';

export const redisSchema = z.object({
  REDIS_URL: z.url(),

  REDIS_TLS: booleanEnv('false'),

  REDIS_KEY_PREFIX: z
    .string()
    .regex(REDIS_KEY_PREFIX_PATTERN, 'must not contain { or }')
    .default('')
    .transform((value) =>
      value.length === 0 || value.endsWith(REDIS_KEY_SEPARATOR) ? value : `${value}${REDIS_KEY_SEPARATOR}`,
    ),

  REDIS_CONNECT_TIMEOUT_MS: positiveIntEnv(REDIS_DEFAULTS.CONNECT_TIMEOUT_MS),

  REDIS_COMMAND_TIMEOUT_MS: positiveIntEnv(REDIS_DEFAULTS.COMMAND_TIMEOUT_MS),

  REDIS_MAX_RETRIES_PER_REQUEST: nonNegativeIntEnv(REDIS_DEFAULTS.MAX_RETRIES_PER_REQUEST),

  REDIS_RECONNECT_MAX_ATTEMPTS: nonNegativeIntEnv(REDIS_DEFAULTS.RECONNECT_MAX_ATTEMPTS),

  REDIS_RECONNECT_BASE_DELAY_MS: positiveIntEnv(REDIS_DEFAULTS.RECONNECT_BASE_DELAY_MS),

  REDIS_RECONNECT_MAX_DELAY_MS: positiveIntEnv(REDIS_DEFAULTS.RECONNECT_MAX_DELAY_MS),
});
