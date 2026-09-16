import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { currentPasswordSchema, passwordSchema } from '#/shared/schemas/index.js';

export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema.describe('Current password of the user.'),

    newPassword: passwordSchema.describe('New password of the user.'),
  })
  .strict();

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
