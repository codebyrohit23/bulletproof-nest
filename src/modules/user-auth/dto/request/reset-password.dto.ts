import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { passwordSchema } from '#/shared/schemas/index.js';

import { PASSWORD_RESET_TOKEN_MAX_LENGTH } from '../../constants/index.js';

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    token: z
      .string()
      .trim()
      .min(1, 'Token is required')
      .max(PASSWORD_RESET_TOKEN_MAX_LENGTH)
      .describe('The `resetToken` returned by `/auth/password-reset/verify-otp`.'),
  })
  .strict();

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
