import { z } from 'zod';

import { appSchema } from '../app/app.schema.js';
import { databaseSchema } from '../database/database.schema.js';
import { emailSchema } from '../email/email.schema.js';
import { jwtSchema } from '../jwt/jwt.schema.js';
import { redisSchema } from '../redis/redis.schema.js';
import { securitySchema } from '../security/security.schema.js';
import { seedSchema } from '../seed/seed.schema.js';

export const envSchema = z.object({
  ...appSchema.shape,
  ...databaseSchema.shape,
  ...emailSchema.shape,
  ...jwtSchema.shape,
  ...redisSchema.shape,
  ...seedSchema.shape,
  ...securitySchema.shape,
});
