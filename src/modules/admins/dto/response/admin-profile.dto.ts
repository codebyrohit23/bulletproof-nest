import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

const adminProfileSchema = z.object({
  id: idSchema,

  email: z.email(),

  firstName: z.string(),

  lastName: z.string().nullable(),

  displayName: z.string(),
});

export class AdminProfileDto extends createZodDto(adminProfileSchema) {}

export type AdminProfile = z.infer<typeof adminProfileSchema>;
