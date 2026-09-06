import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { REFRESH_TOKEN_MAX_LENGTH } from '../../constants/index.js';

const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1)
      .max(REFRESH_TOKEN_MAX_LENGTH)
      .optional()
      .describe(
        'Native clients only. Web clients omit this entirely — their refresh token travels ' +
          'in an HttpOnly cookie the browser attaches on its own.',
      ),
  })
  .strict();

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
