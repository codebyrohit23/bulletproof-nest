import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { identifierSchema } from '#/shared/schemas/index.js';

const otpLoginRequestSchema = z
  .object({
    identifier: identifierSchema,
  })
  .strict();

export class OtpLoginRequestDto extends createZodDto(otpLoginRequestSchema) {}

export type OtpLoginRequestInput = z.infer<typeof otpLoginRequestSchema>;
