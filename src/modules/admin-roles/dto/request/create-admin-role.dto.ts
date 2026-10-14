import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ADMIN_ROLE_DESCRIPTION_MAX_LENGTH, ADMIN_ROLE_NAME } from '../../constants/index.js';

import { adminRolePermissionsSchema } from './admin-role-permissions.schema.js';

const createAdminRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        ADMIN_ROLE_NAME.MIN_LENGTH,
        `Name must be at least ${ADMIN_ROLE_NAME.MIN_LENGTH} characters`,
      )
      .max(ADMIN_ROLE_NAME.MAX_LENGTH),

    description: z.string().trim().max(ADMIN_ROLE_DESCRIPTION_MAX_LENGTH).optional(),

    permissions: adminRolePermissionsSchema,
  })
  .strict();

export class CreateAdminRoleDto extends createZodDto(createAdminRoleSchema) {}

export type CreateAdminRoleInput = z.infer<typeof createAdminRoleSchema>;
