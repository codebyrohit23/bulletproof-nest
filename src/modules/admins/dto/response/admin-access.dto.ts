import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ADMIN_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';
import { idSchema } from '#/shared/schemas/index.js';

/** The admin permission keys as an enum, so a client can generate its constants from OpenAPI. */
const adminPermissionKeySchema = z.enum(
  ADMIN_PERMISSION_CATALOGUE.keys as unknown as [string, ...string[]],
);

const adminAccessSchema = z.object({
  adminId: idSchema,

  isSuperAdmin: z
    .boolean()
    .describe('For display only. A super admin already receives every key in `permissions`.'),

  roles: z.array(z.object({ id: idSchema, name: z.string() })).describe('For display.'),

  permissions: z
    .array(adminPermissionKeySchema)
    .describe(
      'Every key the admin holds, sorted. Show or hide UI from this list alone — it is what ' +
        'the API checks.',
    ),
});

export class AdminAccessDto extends createZodDto(adminAccessSchema) {}

export type AdminAccess = z.infer<typeof adminAccessSchema>;
