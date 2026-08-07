import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { JwtConfig } from './jwt.interface.js';

export const jwtConfig = registerAs('jwt', (): JwtConfig => ({
  privateKey: env.JWT_PRIVATE_KEY,

  publicKey: env.JWT_PUBLIC_KEY,

  previousPublicKey: env.JWT_PUBLIC_KEY_PREVIOUS ?? '',

  issuer: env.JWT_ISSUER,
}));
