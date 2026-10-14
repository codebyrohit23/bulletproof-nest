import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const workspacePermissionSchema = z.object({
  key: z.string().describe('`<resource>.<action>` — what a role grants and a route requires.'),

  resource: z.string().describe('Groups the keys in a role editor.'),

  action: z.string(),

  name: z.string(),

  description: z.string(),

  restricted: z
    .boolean()
    .describe('Owner only. No role can be granted it; a role editor disables it.'),
});

const workspacePermissionCatalogueSchema = z.object({
  items: z.array(workspacePermissionSchema),
});

export class WorkspacePermissionCatalogueDto extends createZodDto(
  workspacePermissionCatalogueSchema,
) {}

export type WorkspacePermissionCatalogue = z.infer<typeof workspacePermissionCatalogueSchema>;
