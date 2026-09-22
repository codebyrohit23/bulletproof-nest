import { z } from 'zod';

import { idSchema } from '#/shared/schemas/index.js';

export const authAdminSchema = z.object({
  id: idSchema,

  email: z.email(),

  firstName: z.string(),

  lastName: z.string().optional(),

  displayName: z.string(),
});

export type AuthAdmin = z.infer<typeof authAdminSchema>;
