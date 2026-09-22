import { z } from 'zod';

export const adminAuthTokensSchema = z.object({
  accessToken: z.string(),

  expiresIn: z.number().int().positive().describe('Seconds until the access token expires.'),
});

export type AdminAuthTokens = z.infer<typeof adminAuthTokensSchema>;
