import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

import { userAuthTokensSchema } from '../../schemas/index.js';

export class UserAuthTokensDto extends createZodDto(userAuthTokensSchema) {}

export type UserAuthTokens = z.infer<typeof userAuthTokensSchema>;
