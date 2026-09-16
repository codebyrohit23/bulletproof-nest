import { DevicePlatform } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { lookupEmailSchema, currentPasswordSchema } from '#/shared/schemas/index.js';

import { DECLARED_DEVICE_DESCRIPTION, declaredDeviceSchema } from '../../schemas/index.js';

const loginSchema = z
  .object({
    email: lookupEmailSchema,

    password: currentPasswordSchema,

    platform: z.enum(DevicePlatform).default(DevicePlatform.WEB),

    device: declaredDeviceSchema.optional().describe(DECLARED_DEVICE_DESCRIPTION),
  })
  .strict();

export class LoginDto extends createZodDto(loginSchema) {}

export type LoginInput = z.infer<typeof loginSchema>;
