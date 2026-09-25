import { z } from 'zod';

export const userAuthTokensSchema = z.object({
  accessToken: z.string(),

  refreshToken: z.string().optional(),

  expiresIn: z.number().int().positive(),
});
