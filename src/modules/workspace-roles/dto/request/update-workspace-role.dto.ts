import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  WORKSPACE_ROLE_DESCRIPTION_MAX_LENGTH,
  WORKSPACE_ROLE_NAME,
} from '../../constants/index.js';

import { workspaceRolePermissionsSchema } from './workspace-role-permissions.schema.js';

const updateWorkspaceRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        WORKSPACE_ROLE_NAME.MIN_LENGTH,
        `Name must be at least ${WORKSPACE_ROLE_NAME.MIN_LENGTH} characters`,
      )
      .max(WORKSPACE_ROLE_NAME.MAX_LENGTH)
      .optional(),

    description: z
      .string()
      .trim()
      .max(WORKSPACE_ROLE_DESCRIPTION_MAX_LENGTH)
      .nullable()
      .optional()
      .describe('`null` clears it.'),

    permissions: workspaceRolePermissionsSchema.optional(),
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

export class UpdateWorkspaceRoleDto extends createZodDto(updateWorkspaceRoleSchema) {}

export type UpdateWorkspaceRoleInput = z.infer<typeof updateWorkspaceRoleSchema>;
