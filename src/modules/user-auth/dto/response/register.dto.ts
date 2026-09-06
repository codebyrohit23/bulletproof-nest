import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { identifierSchema } from '#/shared/schemas/index.js';

const registerResponseSchema = z.object({
  userId: z.uuid(),

  identifier: identifierSchema,

  verificationRequired: z.literal(true),
});

export class RegisterResponseDto extends createZodDto(registerResponseSchema) {}

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
