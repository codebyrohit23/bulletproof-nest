import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { passwordSchema } from '#/shared/schemas/index.js';

import { USER_PASSWORD_RESET_TOKEN_MAX_LENGTH } from '../../constants/index.js';

const userResetPasswordSchema = z
  .object({
    password: passwordSchema,
    token: z
      .string()
      .trim()
      .min(1, 'Token is required')
      .max(USER_PASSWORD_RESET_TOKEN_MAX_LENGTH)
      .describe('The `resetToken` returned by `/auth/password-reset/verify-otp`.'),
  })
  .strict();

export class UserResetPasswordDto extends createZodDto(userResetPasswordSchema) {}

export type UserResetPasswordInput = z.infer<typeof userResetPasswordSchema>;
