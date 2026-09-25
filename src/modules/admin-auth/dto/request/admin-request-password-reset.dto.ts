import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { lookupEmailSchema } from '#/shared/schemas/index.js';

const adminRequestPasswordResetSchema = z
  .object({
    email: lookupEmailSchema,
  })
  .strict();

export class AdminRequestPasswordResetDto extends createZodDto(adminRequestPasswordResetSchema) {}

export type AdminRequestPasswordResetInput = z.infer<typeof adminRequestPasswordResetSchema>;
