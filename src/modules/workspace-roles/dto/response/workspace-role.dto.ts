import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

export const workspaceRoleSchema = z.object({
  id: idSchema,

  key: z
    .string()
    .nullable()
    .describe('`admin`, `manager` or `agent` on a default role; null on a custom one.'),

  name: z.string(),

  description: z.string().nullable(),

  isSystem: z.boolean(),

  editable: z
    .boolean()
    .describe(
      'Whether the caller may rename, edit or delete this role: false for default roles, ' +
        'without `role.manage`, or when the role has a permission the caller does not. ' +
        'Use this, not `isSystem`, to show edit controls.',
    ),

  permissions: z.array(z.string()).describe('Sorted permission keys.'),

  memberCount: z
    .number()
    .int()
    .describe('Active and suspended members of this workspace who hold the role.'),

  createdAt: z.iso.datetime(),

  updatedAt: z.iso.datetime(),
});

export class WorkspaceRoleDto extends createZodDto(workspaceRoleSchema) {}

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

const workspaceRoleListSchema = z.object({ items: z.array(workspaceRoleSchema) });

export class WorkspaceRoleListDto extends createZodDto(workspaceRoleListSchema) {}

export type WorkspaceRoleList = z.infer<typeof workspaceRoleListSchema>;
