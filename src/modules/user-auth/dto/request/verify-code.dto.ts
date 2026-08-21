import { DevicePlatform } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { VERIFICATION_CODE_PATTERN } from '../../constants/index.js';
import { identifierSchema } from '../../schemas/index.js';

const verifyCodeSchema = z
  .object({
    identifier: identifierSchema,

    code: z.string().trim().regex(VERIFICATION_CODE_PATTERN, 'Verification code must be 6 digits'),

    platform: z.enum(DevicePlatform).default(DevicePlatform.WEB),
  })
  .strict();

export class VerifyCodeDto extends createZodDto(verifyCodeSchema) {}

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
