import { z } from 'zod';

import { base64PemEnv } from '../shared/schema.helpers.js';

import { PEM_PRIVATE_KEY_HEADER, PEM_PUBLIC_KEY_HEADER } from './jwt.constants.js';

export const jwtSchema = z.object({
  JWT_PRIVATE_KEY: base64PemEnv(PEM_PRIVATE_KEY_HEADER),

  JWT_PUBLIC_KEY: base64PemEnv(PEM_PUBLIC_KEY_HEADER),

  JWT_PUBLIC_KEY_PREVIOUS: base64PemEnv(PEM_PUBLIC_KEY_HEADER).optional(),

  JWT_ISSUER: z.url(),
});
