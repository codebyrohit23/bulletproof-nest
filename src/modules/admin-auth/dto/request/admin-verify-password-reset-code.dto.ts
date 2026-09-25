import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { lookupEmailSchema, verificationCodeSchema } from '#/shared/schemas/index.js';

const adminVerifyPasswordResetCodeSchema = z
  .object({
    email: lookupEmailSchema,

    code: verificationCodeSchema,
  })
  .strict();

export class AdminVerifyPasswordResetCodeDto extends createZodDto(
  adminVerifyPasswordResetCodeSchema,
) {}

export type AdminVerifyPasswordResetCodeInput = z.infer<typeof adminVerifyPasswordResetCodeSchema>;
