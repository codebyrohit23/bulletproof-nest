import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AUTH_RESULT_STATUS } from '../../constants/index.js';
import { authTokensSchema, authUserSchema } from '../../schemas/index.js';

export const authResultSchema = z.object({
  status: z
    .enum(AUTH_RESULT_STATUS)
    .describe('Branch on this. `AUTHENTICATED` is the only value that carries tokens.'),

  user: authUserSchema,

  tokens: authTokensSchema.nullable(),
});

export class AuthResultDto extends createZodDto(authResultSchema) {}

export type AuthResult = z.infer<typeof authResultSchema>;
