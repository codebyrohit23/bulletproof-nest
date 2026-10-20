import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { attachedImageSchema } from '#/modules/files/index.js';

const userProfileSchema = z.object({
  id: z.uuid(),

  firstName: z.string(),

  lastName: z.string().nullable(),

  displayName: z.string(),

  avatar: attachedImageSchema
    .nullable()
    .describe('Null when there is no avatar, and while a new one is still being processed.'),
});

export class UserProfileDto extends createZodDto(userProfileSchema) {}

export type UserProfile = z.infer<typeof userProfileSchema>;
