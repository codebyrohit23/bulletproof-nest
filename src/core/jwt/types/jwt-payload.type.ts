import type { z } from 'zod';

import type { accessTokenPayloadSchema } from '../schemas/jwt-payload.schema.js';

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export type AccessTokenClaims = Omit<AccessTokenPayload, 'typ' | 'jti' | 'iat' | 'exp'>;
