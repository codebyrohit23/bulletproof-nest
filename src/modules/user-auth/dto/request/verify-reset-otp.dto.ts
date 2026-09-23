import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupEmailSchema, verificationCodeSchema } from '#/shared/schemas/index.js';

const verifyResetOtpSchema = z
  .object({
    email: lookupEmailSchema,

    code: verificationCodeSchema,
  })
  .strict();

export class VerifyResetOtpDto extends createZodDto(verifyResetOtpSchema) {}

export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
