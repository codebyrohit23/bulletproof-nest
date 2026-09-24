import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { lookupEmailSchema } from '#/shared/schemas/index.js';

const adminPasswordResetRequestSchema = z
  .object({
    email: lookupEmailSchema,
  })
  .strict();

export class AdminPasswordResetRequestDto extends createZodDto(adminPasswordResetRequestSchema) {}

export type AdminPasswordResetRequestInput = z.infer<typeof adminPasswordResetRequestSchema>;
