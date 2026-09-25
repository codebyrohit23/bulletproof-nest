import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { USER_AUTH_RESULT_STATUS } from '../../constants/index.js';
import { userAuthTokensSchema, authUserSchema } from '../../schemas/index.js';

export const userAuthResultSchema = z.object({
  status: z
    .enum(USER_AUTH_RESULT_STATUS)
    .describe('Branch on this. `AUTHENTICATED` is the only value that carries tokens.'),

  user: authUserSchema,

  tokens: userAuthTokensSchema.nullable(),
});

export class UserAuthResultDto extends createZodDto(userAuthResultSchema) {}

export type UserAuthResult = z.infer<typeof userAuthResultSchema>;
