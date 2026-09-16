import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupIdentifierSchema } from '#/shared/schemas/index.js';

const otpLoginRequestSchema = z
  .object({
    identifier: lookupIdentifierSchema,
  })
  .strict();

export class OtpLoginRequestDto extends createZodDto(otpLoginRequestSchema) {}

export type OtpLoginRequestInput = z.infer<typeof otpLoginRequestSchema>;
