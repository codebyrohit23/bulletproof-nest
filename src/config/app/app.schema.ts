import { z } from 'zod';

import { ENVIRONMENTS } from '@/config/app/app.constants.js';
// Direct import, not the logger barrel: that barrel pulls in AppLoggerModule,
// which imports AppConfigModule, which lands back here as a startup cycle.
import { LOG_LEVEL } from '@/core/logger/logger.constants.js';

export const appSchema = z.object({
  NODE_ENV: z.enum(ENVIRONMENTS),

  APP_NAME: z.string().min(1),

  HOST: z.string(),

  PORT: z.coerce.number().int().positive(),

  LOG_LEVEL: z.enum(LOG_LEVEL),

  REQUEST_TIMEOUT_MS: z.coerce.number(),
});
