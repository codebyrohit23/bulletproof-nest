import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.uuid(),

  firstName: z.string(),

  lastName: z.string().optional(),

  displayName: z.string(),

  // avatarFileId: z.uuid().nullable(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
