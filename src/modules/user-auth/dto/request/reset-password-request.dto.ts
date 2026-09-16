import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupEmailSchema } from '#/shared/schemas/index.js';

const resetPasswordRequestSchema = z
  .object({
    email: lookupEmailSchema,
  })
  .strict();

export class ResetPasswordRequestDto extends createZodDto(resetPasswordRequestSchema) {}

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
