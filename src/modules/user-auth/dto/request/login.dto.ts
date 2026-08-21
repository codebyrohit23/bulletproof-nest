import { DevicePlatform } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PASSWORD_MAX_LENGTH } from '#/core/security/index.js';
import { IDENTIFIER_MAX_LENGTH } from '#/modules/user-auth/constants/index.js';

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(IDENTIFIER_MAX_LENGTH)),

    password: z.string().min(1, 'Password is required').max(PASSWORD_MAX_LENGTH),

    platform: z.enum(DevicePlatform).default(DevicePlatform.WEB),
  })
  .strict();

export class LoginDto extends createZodDto(loginSchema) {}

export type LoginInput = z.infer<typeof loginSchema>;
