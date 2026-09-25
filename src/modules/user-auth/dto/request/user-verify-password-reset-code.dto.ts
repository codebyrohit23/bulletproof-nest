import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupEmailSchema, verificationCodeSchema } from '#/shared/schemas/index.js';

const userVerifyPasswordResetCodeSchema = z
  .object({
    email: lookupEmailSchema,

    code: verificationCodeSchema,
  })
  .strict();

export class UserVerifyPasswordResetCodeDto extends createZodDto(
  userVerifyPasswordResetCodeSchema,
) {}

export type UserVerifyPasswordResetCodeInput = z.infer<typeof userVerifyPasswordResetCodeSchema>;
