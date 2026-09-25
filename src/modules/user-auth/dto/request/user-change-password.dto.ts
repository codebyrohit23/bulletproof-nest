import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { currentPasswordSchema, passwordSchema } from '#/shared/schemas/index.js';

export const userChangePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema.describe('Current password of the user.'),

    newPassword: passwordSchema.describe('New password of the user.'),
  })
  .strict();

export class UserChangePasswordDto extends createZodDto(userChangePasswordSchema) {}

export type UserChangePasswordInput = z.infer<typeof userChangePasswordSchema>;
