import { z } from 'zod';

import { JWT_TOKEN_TYPE } from '../constants/jwt.constants.js';

const baseClaimsShape = {
  jti: z.uuid(),

  iat: z.number().int().positive(),

  exp: z.number().int().positive(),
};

export const accessTokenPayloadSchema = z.object({
  ...baseClaimsShape,

  typ: z.literal(JWT_TOKEN_TYPE.ACCESS),

  sub: z.uuid(),

  sid: z.uuid(),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export type AccessTokenClaims = Omit<AccessTokenPayload, 'typ' | 'jti' | 'iat' | 'exp'>;
