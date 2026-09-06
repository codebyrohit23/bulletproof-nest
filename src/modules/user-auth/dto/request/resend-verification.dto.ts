import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { identifierSchema } from '#/shared/schemas/index.js';

const resendVerificationSchema = z
  .object({
    identifier: identifierSchema,
  })
  .strict();

export class ResendVerificationDto extends createZodDto(resendVerificationSchema) {}

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
