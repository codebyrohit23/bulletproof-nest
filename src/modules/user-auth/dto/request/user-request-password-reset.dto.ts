import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupEmailSchema } from '#/shared/schemas/index.js';

const userRequestPasswordResetSchema = z
  .object({
    email: lookupEmailSchema,
  })
  .strict();

export class UserRequestPasswordResetDto extends createZodDto(userRequestPasswordResetSchema) {}

export type UserRequestPasswordResetInput = z.infer<typeof userRequestPasswordResetSchema>;
