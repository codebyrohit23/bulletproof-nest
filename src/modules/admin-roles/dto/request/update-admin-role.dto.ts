import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ADMIN_ROLE_DESCRIPTION_MAX_LENGTH, ADMIN_ROLE_NAME } from '../../constants/index.js';

import { adminRolePermissionsSchema } from './admin-role-permissions.schema.js';

const updateAdminRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        ADMIN_ROLE_NAME.MIN_LENGTH,
        `Name must be at least ${ADMIN_ROLE_NAME.MIN_LENGTH} characters`,
      )
      .max(ADMIN_ROLE_NAME.MAX_LENGTH)
      .optional(),

    description: z
      .string()
      .trim()
      .max(ADMIN_ROLE_DESCRIPTION_MAX_LENGTH)
      .nullable()
      .optional()
      .describe('`null` clears it.'),

    permissions: adminRolePermissionsSchema.optional(),
  })
  .strict()
  .check((ctx) => {
    if (Object.values(ctx.value).every((value) => value === undefined)) {
      ctx.issues.push({
        code: 'custom',
        message: 'Provide at least one field to update',
        input: ctx.value,
      });
    }
  });

export class UpdateAdminRoleDto extends createZodDto(updateAdminRoleSchema) {}

export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>;
