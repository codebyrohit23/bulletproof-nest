import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

import { authTokensSchema } from '../../schemas/index.js';

export class AuthTokensDto extends createZodDto(authTokensSchema) {}

export type AuthTokens = z.infer<typeof authTokensSchema>;
