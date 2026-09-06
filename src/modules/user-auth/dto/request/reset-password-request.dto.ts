import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { IDENTIFIER_MAX_LENGTH } from '#/shared/constants/index.js';

const resetPasswordRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(IDENTIFIER_MAX_LENGTH)),
  })
  .strict();

export class ResetPasswordRequestDto extends createZodDto(resetPasswordRequestSchema) {}

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
