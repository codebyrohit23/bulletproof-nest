import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ADMIN_AUTH_RESULT_STATUS } from '../../constants/index.js';
import { adminAuthTokensSchema, authAdminSchema } from '../../schemas/index.js';

const adminAuthResultSchema = z.object({
  status: z
    .enum(ADMIN_AUTH_RESULT_STATUS)
    .describe('Branch on this. `AUTHENTICATED` is the only value that carries tokens.'),

  admin: authAdminSchema,

  tokens: adminAuthTokensSchema,
});

export class AdminAuthResultDto extends createZodDto(adminAuthResultSchema) {}

export type AdminAuthResult = z.infer<typeof adminAuthResultSchema>;
