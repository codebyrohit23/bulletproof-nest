import { z } from 'zod';

import { envSchema } from './schema.js';

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables', z.prettifyError(result.error));

    throw new Error('Environment validation failed.');
  }

  return Object.freeze(result.data);
}
