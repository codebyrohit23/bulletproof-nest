import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { lookupEmailSchema, verificationCodeSchema } from '#/shared/schemas/index.js';

const adminVerifyResetOtpSchema = z
  .object({
    email: lookupEmailSchema,

    code: verificationCodeSchema,
  })
  .strict();

export class AdminVerifyResetOtpDto extends createZodDto(adminVerifyResetOtpSchema) {}

export type AdminVerifyResetOtpInput = z.infer<typeof adminVerifyResetOtpSchema>;
