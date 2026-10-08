import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { WORKSPACE_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';
import { idSchema } from '#/shared/schemas/index.js';

/**
 * The permission keys as an enum, so the OpenAPI document lists every key and
 * a client can generate its constants from it.
 */
const workspacePermissionKeySchema = z.enum(
  WORKSPACE_PERMISSION_CATALOGUE.keys as unknown as [string, ...string[]],
);

const workspaceAccessSchema = z.object({
  workspaceId: idSchema,

  member: z.object({
    id: idSchema,

    isOwner: z
      .boolean()
      .describe('For display only. The owner already receives every key in `permissions`.'),
  }),

  roles: z
    .array(
      z.object({
        id: idSchema,

        key: z.string().nullable().describe('`admin`, `manager` or `agent` on a default role.'),

        name: z.string(),

        isSystem: z.boolean(),
      }),
    )
    .describe('For display. Empty for the owner, who holds no role.'),

  permissions: z
    .array(workspacePermissionKeySchema)
    .describe(
      'Every key the caller holds in this workspace, sorted. Show or hide UI from this list ' +
        'alone — it is what the API checks.',
    ),
});

export class WorkspaceAccessDto extends createZodDto(workspaceAccessSchema) {}

export type WorkspaceAccess = z.infer<typeof workspaceAccessSchema>;
