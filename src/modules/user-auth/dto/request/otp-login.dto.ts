import { DevicePlatform } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { VERIFICATION_CODE_PATTERN } from '#/modules/verification/index.js';
import { identifierSchema } from '#/shared/schemas/index.js';

import { DECLARED_DEVICE_DESCRIPTION, declaredDeviceSchema } from '../../schemas/index.js';

const otpLoginSchema = z
  .object({
    identifier: identifierSchema,

    code: z.string().trim().regex(VERIFICATION_CODE_PATTERN, 'Login code must be 6 digits'),

    platform: z.enum(DevicePlatform).default(DevicePlatform.WEB),

    device: declaredDeviceSchema.optional().describe(DECLARED_DEVICE_DESCRIPTION),
  })
  .strict();

export class OtpLoginDto extends createZodDto(otpLoginSchema) {}

export type OtpLoginInput = z.infer<typeof otpLoginSchema>;
