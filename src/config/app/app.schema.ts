import { z } from 'zod';

import { BODY_LIMIT_BYTES, ENVIRONMENTS } from '#/config/app/app.constants.js';
/*
 * Direct import, never the `core/logger` barrel.
 *
 * That barrel exports `AppLoggerModule`, which imports `AppConfigModule`, which
 * loads this file again — a startup cycle that fails at boot with
 * "Cannot access 'LOG_LEVEL' before initialization". TypeScript resolves types
 * straight through it, so `typecheck` and `lint` both stay green and the only
 * symptom is a process that will not start.
 *
 * The constants file imports nothing, so this direction stays acyclic.
 */
import { LOG_FORMAT, LOG_LEVEL } from '#/shared/constants/index.js';

import { booleanEnv, positiveIntEnv } from '../shared/index.js';

export const appSchema = z.object({
  NODE_ENV: z.enum(ENVIRONMENTS),

  APP_NAME: z.string().min(1),

  /** The web app users sign in to. Emails link here, so it must be absolute. */
  APP_WEB_URL: z.url(),

  /**
   * The admin console. Separate from `APP_WEB_URL` because admin emails must
   * never send an admin to the user app, or a user to the console.
   */
  ADMIN_WEB_APP_URL: z.url(),

  HOST: z.string(),

  PORT: z.coerce.number().int().positive(),

  LOG_LEVEL: z.enum(LOG_LEVEL),

  LOG_FORMAT: z.enum(LOG_FORMAT).default(LOG_FORMAT.JSON),

  DOCS_ENABLED: booleanEnv('false'),

  REQUEST_TIMEOUT_MS: z.coerce.number(),

  /**
   * Read by `main.ts` only — it is a `FastifyAdapter` option, and the adapter
   * is built before the DI container exists, so it never reaches `AppConfig`.
   */
  BODY_LIMIT_BYTES: positiveIntEnv(BODY_LIMIT_BYTES),
});
