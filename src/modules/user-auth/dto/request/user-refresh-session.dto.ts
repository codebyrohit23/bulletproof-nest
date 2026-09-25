import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { USER_REFRESH_TOKEN_MAX_LENGTH } from '../../constants/index.js';

const userRefreshSessionSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1)
      .max(USER_REFRESH_TOKEN_MAX_LENGTH)
      .optional()
      .describe(
        'Native clients only. Web clients omit this entirely — their refresh token travels ' +
          'in an HttpOnly cookie the browser attaches on its own.',
      ),
  })
  .strict();

export class UserRefreshSessionDto extends createZodDto(userRefreshSessionSchema) {}

export type UserRefreshSessionInput = z.infer<typeof userRefreshSessionSchema>;
