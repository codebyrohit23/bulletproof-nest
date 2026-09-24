import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { passwordSchema } from '#/shared/schemas/index.js';

import { ADMIN_PASSWORD_RESET_TOKEN_MAX_LENGTH } from '../../constants/index.js';

const adminResetPasswordSchema = z
  .object({
    password: passwordSchema,

    token: z
      .string()
      .trim()
      .min(1, 'Token is required')
      .max(ADMIN_PASSWORD_RESET_TOKEN_MAX_LENGTH)
      .describe('The `resetToken` returned by `/admin/auth/password-reset/verify-otp`.'),
  })
  .strict();

export class AdminResetPasswordDto extends createZodDto(adminResetPasswordSchema) {}

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
