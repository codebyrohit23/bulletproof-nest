import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupIdentifierSchema } from '#/shared/schemas/index.js';

const userResendVerificationSchema = z
  .object({
    identifier: lookupIdentifierSchema,
  })
  .strict();

export class UserResendVerificationDto extends createZodDto(userResendVerificationSchema) {}

export type UserResendVerificationInput = z.infer<typeof userResendVerificationSchema>;
