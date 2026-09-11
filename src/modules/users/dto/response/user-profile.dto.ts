import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const userProfileSchema = z.object({
  id: z.uuid(),

  firstName: z.string(),

  lastName: z.string().nullable(),

  displayName: z.string(),
});

export class UserProfileDto extends createZodDto(userProfileSchema) {}

export type UserProfile = z.infer<typeof userProfileSchema>;
