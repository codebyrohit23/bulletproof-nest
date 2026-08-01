import { z } from 'zod';

import { appSchema } from '../app/app.schema.js';
import { databaseSchema } from '../database/database.schema.js';
import { securitySchema } from '../security/security.schema.js';

/**
 * Imports point at the schema files directly, never at the domain barrels.
 *
 * A barrel also exports its `*.config.ts`, which imports `env.ts`, which imports
 * this file — a cycle that TypeScript accepts and Node then fails on at startup
 * with "Cannot access 'appSchema' before initialization". Schema files import
 * nothing that reads the environment, so this direction stays acyclic.
 */
export const envSchema = z.object({
  ...appSchema.shape,
  ...databaseSchema.shape,
  ...securitySchema.shape,
});
