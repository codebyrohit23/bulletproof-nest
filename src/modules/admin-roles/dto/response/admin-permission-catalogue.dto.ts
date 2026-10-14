import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const adminPermissionSchema = z.object({
  key: z.string().describe('`<resource>.<action>` — what a role grants and a route requires.'),

  resource: z.string().describe('Groups the keys in a role editor.'),

  action: z.string(),

  name: z.string(),

  description: z.string(),

  restricted: z
    .boolean()
    .describe('Super admin only. No role can be granted it; a role editor disables it.'),
});

const adminPermissionCatalogueSchema = z.object({
  items: z.array(adminPermissionSchema),
});

export class AdminPermissionCatalogueDto extends createZodDto(adminPermissionCatalogueSchema) {}

export type AdminPermissionCatalogue = z.infer<typeof adminPermissionCatalogueSchema>;
