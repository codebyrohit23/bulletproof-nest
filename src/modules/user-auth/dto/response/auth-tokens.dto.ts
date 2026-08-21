import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { authUserSchema } from './auth-user.dto.js';

/**
 * What a successful authentication returns.
 *
 * One shape serving four endpoints — verify-code, login, refresh, and any
 * future social sign-in. That reuse is why response DTOs sit in a flat folder
 * rather than one per flow: splitting them would mean four definitions of the
 * same contract, drifting apart the first time one is edited.
 */
export const authTokensSchema = z.object({
  /**
   * The short-lived JWT. Sent as `Authorization: Bearer <token>` on every
   * authenticated request.
   */
  accessToken: z.string(),

  /**
   * The long-lived opaque token, used only to obtain a new access token.
   *
   * Random bytes, not a JWT — the server stores its hash, which is what makes
   * it revocable. Returned in the body for mobile clients that have no cookie
   * jar; the browser client receives it as an `httpOnly` cookie instead, and
   * for that audience this field is redundant but harmless.
   */
  refreshToken: z.string(),

  /**
   * Seconds until the access token expires.
   *
   * Returned so a client can schedule its refresh instead of decoding the JWT
   * to find out — decoding invites clients to read other claims and depend on
   * them, and a client that parses your token is a client that breaks when the
   * payload changes.
   */
  expiresIn: z.number().int().positive(),

  user: authUserSchema,
});

export class AuthTokensDto extends createZodDto(authTokensSchema) {}

export type AuthTokens = z.infer<typeof authTokensSchema>;
