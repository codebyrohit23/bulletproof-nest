import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { EMAIL_MAX_LENGTH } from '#/shared/constants/index.js';

const resetPasswordRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(EMAIL_MAX_LENGTH)),
  })
  .strict();

export class ResetPasswordRequestDto extends createZodDto(resetPasswordRequestSchema) {}

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
