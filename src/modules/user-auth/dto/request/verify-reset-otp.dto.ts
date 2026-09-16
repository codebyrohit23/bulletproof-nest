import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { VERIFICATION_CODE_PATTERN } from '#/modules/verification/index.js';
import { lookupEmailSchema } from '#/shared/schemas/index.js';

const verifyResetOtpSchema = z
  .object({
    email: lookupEmailSchema,

    code: z.string().trim().regex(VERIFICATION_CODE_PATTERN, 'Login code must be 6 digits'),
  })
  .strict();

export class VerifyResetOtpDto extends createZodDto(verifyResetOtpSchema) {}

export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
