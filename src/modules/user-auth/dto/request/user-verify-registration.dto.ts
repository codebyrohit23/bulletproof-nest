import { DevicePlatform } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { lookupIdentifierSchema, verificationCodeSchema } from '#/shared/schemas/index.js';

import { DECLARED_DEVICE_DESCRIPTION, declaredDeviceSchema } from '../../schemas/index.js';

const userVerifyRegistrationSchema = z
  .object({
    identifier: lookupIdentifierSchema,

    code: verificationCodeSchema,

    platform: z.enum(DevicePlatform).default(DevicePlatform.WEB),

    device: declaredDeviceSchema.optional().describe(DECLARED_DEVICE_DESCRIPTION),
  })
  .strict();

export class UserVerifyRegistrationDto extends createZodDto(userVerifyRegistrationSchema) {}

export type UserVerifyRegistrationInput = z.infer<typeof userVerifyRegistrationSchema>;
