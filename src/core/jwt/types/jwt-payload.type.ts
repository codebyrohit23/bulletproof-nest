import type { z } from 'zod';

import type { JWT_AUDIENCE } from '../constants/jwt.constants.js';
import type { accessTokenPayloadSchema, verificationTokenPayloadSchema } from '../schemas/jwt-payload.schema.js';

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export type VerificationTokenPayload = z.infer<typeof verificationTokenPayloadSchema>;

export type AccessTokenClaims = Omit<AccessTokenPayload, 'typ' | 'jti' | 'iat' | 'exp'>;

export type VerificationTokenClaims = Omit<VerificationTokenPayload, 'typ' | 'jti' | 'iat' | 'exp'>;

export type AccessAudience = typeof JWT_AUDIENCE.USER | typeof JWT_AUDIENCE.ADMIN;
