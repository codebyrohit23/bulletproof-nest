import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { identifierSchema } from '#/shared/schemas/index.js';

const userRegisterResponseSchema = z.object({
  userId: z.uuid(),

  identifier: identifierSchema,

  verificationRequired: z.literal(true),
});

export class UserRegisterResponseDto extends createZodDto(userRegisterResponseSchema) {}

export type UserRegisterResponse = z.infer<typeof userRegisterResponseSchema>;
