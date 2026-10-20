import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { attachedImageSchema } from '#/modules/files/index.js';
import { idSchema } from '#/shared/schemas/index.js';

const adminProfileSchema = z.object({
  id: idSchema,

  email: z.email(),

  firstName: z.string(),

  lastName: z.string().nullable(),

  displayName: z.string(),

  avatar: attachedImageSchema
    .nullable()
    .describe('Null when there is no avatar, and while a new one is still being processed.'),
});

export class AdminProfileDto extends createZodDto(adminProfileSchema) {}

export type AdminProfile = z.infer<typeof adminProfileSchema>;
