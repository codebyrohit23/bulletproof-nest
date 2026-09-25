import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { lookupIdentifierSchema } from '#/shared/schemas/index.js';

const userRequestLoginCodeSchema = z
  .object({
    identifier: lookupIdentifierSchema,
  })
  .strict();

export class UserRequestLoginCodeDto extends createZodDto(userRequestLoginCodeSchema) {}

export type UserRequestLoginCodeInput = z.infer<typeof userRequestLoginCodeSchema>;
