import { z } from 'zod';

export const authTokensSchema = z.object({
  accessToken: z.string(),

  refreshToken: z.string().optional(),

  expiresIn: z.number().int().positive(),
});
