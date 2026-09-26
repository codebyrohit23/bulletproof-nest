import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

import { adminAuthTokensSchema } from '../../schemas/index.js';

export class AdminAuthTokensDto extends createZodDto(adminAuthTokensSchema) {}

export type AdminAuthTokens = z.infer<typeof adminAuthTokensSchema>;
