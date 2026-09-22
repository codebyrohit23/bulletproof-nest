import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { currentPasswordSchema, lookupEmailSchema } from '#/shared/schemas/index.js';

const adminLoginSchema = z
  .object({
    email: lookupEmailSchema,

    password: currentPasswordSchema,
  })
  .strict();

export class AdminLoginDto extends createZodDto(adminLoginSchema) {}

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
