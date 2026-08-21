import { z } from 'zod';

import { ENVIRONMENTS } from '#/config/app/app.constants.js';
import { LOG_FORMAT, LOG_LEVEL } from '#/core/logger/logger.constants.js';

import { booleanEnv } from '../shared/schema.helpers.js';

export const appSchema = z.object({
  NODE_ENV: z.enum(ENVIRONMENTS),

  APP_NAME: z.string().min(1),

  HOST: z.string(),

  PORT: z.coerce.number().int().positive(),

  LOG_LEVEL: z.enum(LOG_LEVEL),

  LOG_FORMAT: z.enum(LOG_FORMAT).default(LOG_FORMAT.JSON),

  DOCS_ENABLED: booleanEnv('false'),

  REQUEST_TIMEOUT_MS: z.coerce.number(),
});
