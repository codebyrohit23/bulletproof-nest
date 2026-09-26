import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { currentPasswordSchema, passwordSchema } from '#/shared/schemas/index.js';

const adminChangePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema.describe('Current password of the admin.'),

    newPassword: passwordSchema.describe('New password of the admin.'),
  })
  .strict();

export class AdminChangePasswordDto extends createZodDto(adminChangePasswordSchema) {}

export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
