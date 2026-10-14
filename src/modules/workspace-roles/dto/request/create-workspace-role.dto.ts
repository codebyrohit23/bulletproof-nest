import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  WORKSPACE_ROLE_DESCRIPTION_MAX_LENGTH,
  WORKSPACE_ROLE_NAME,
} from '../../constants/index.js';

import { workspaceRolePermissionsSchema } from './workspace-role-permissions.schema.js';

const createWorkspaceRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        WORKSPACE_ROLE_NAME.MIN_LENGTH,
        `Name must be at least ${WORKSPACE_ROLE_NAME.MIN_LENGTH} characters`,
      )
      .max(WORKSPACE_ROLE_NAME.MAX_LENGTH),

    description: z.string().trim().max(WORKSPACE_ROLE_DESCRIPTION_MAX_LENGTH).optional(),

    permissions: workspaceRolePermissionsSchema,
  })
  .strict();

export class CreateWorkspaceRoleDto extends createZodDto(createWorkspaceRoleSchema) {}

export type CreateWorkspaceRoleInput = z.infer<typeof createWorkspaceRoleSchema>;
