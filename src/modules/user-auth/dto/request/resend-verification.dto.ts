import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupIdentifierSchema } from '#/shared/schemas/index.js';

const resendVerificationSchema = z
  .object({
    identifier: lookupIdentifierSchema,
  })
  .strict();

export class ResendVerificationDto extends createZodDto(resendVerificationSchema) {}

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
