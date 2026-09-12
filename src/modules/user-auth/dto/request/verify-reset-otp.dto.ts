import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { VERIFICATION_CODE_PATTERN } from '#/modules/verification/index.js';
import { IDENTIFIER_MAX_LENGTH } from '#/shared/constants/index.js';

const verifyResetOtpSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(IDENTIFIER_MAX_LENGTH)),

    code: z.string().trim().regex(VERIFICATION_CODE_PATTERN, 'Login code must be 6 digits'),
  })
  .strict();

export class VerifyResetOtpDto extends createZodDto(verifyResetOtpSchema) {}

export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
