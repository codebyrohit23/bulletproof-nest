import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

const adminRoleSchema = z.object({
  id: idSchema,

  name: z.string(),

  description: z.string().nullable(),

  permissions: z.array(z.string()).describe('Sorted permission keys.'),

  adminCount: z.number().int().describe('Admins who hold the role and are not deleted.'),

  createdAt: z.iso.datetime(),

  updatedAt: z.iso.datetime(),
});

export class AdminRoleDto extends createZodDto(adminRoleSchema) {}

export type AdminRole = z.infer<typeof adminRoleSchema>;

const adminRoleListSchema = z.object({ items: z.array(adminRoleSchema) });

export class AdminRoleListDto extends createZodDto(adminRoleListSchema) {}

export type AdminRoleList = z.infer<typeof adminRoleListSchema>;
