import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

import { workspaceSchema } from './workspace.dto.js';

/**
 * The one call a client makes after choosing a workspace. Grows with the
 * platform — roles and permissions arrive with RBAC, the plan with billing —
 * so it is an object of sections rather than a flat workspace.
 */
const currentWorkspaceSchema = z.object({
  workspace: workspaceSchema,

  membership: z.object({
    id: idSchema.describe('The caller’s member id in this workspace.'),

    jobTitle: z.string().nullable(),

    joinedAt: z.iso.datetime(),
  }),
});

export class CurrentWorkspaceDto extends createZodDto(currentWorkspaceSchema) {}

export type CurrentWorkspace = z.infer<typeof currentWorkspaceSchema>;
