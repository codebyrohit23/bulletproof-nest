import { IdentifierType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { identifierSchema } from '#/shared/schemas/index.js';
import { passwordSchema } from '#/shared/schemas/index.js';

const userRegisterSchema = z
  .object({
    identifier: identifierSchema,

    firstName: z.string().trim().min(1, 'First name is required').max(100),

    lastName: z.string().trim().min(1, 'Last name is required').max(100),

    password: passwordSchema
      .optional()
      .describe(
        'Required when `identifier.type` is `EMAIL`. Must be omitted when it is `PHONE`: a phone account ' +
          'authenticates by one-time code and never holds a password.',
      ),
  })
  .strict()
  .check((ctx) => {
    const { identifier, password } = ctx.value;

    if (identifier.type === IdentifierType.EMAIL && password === undefined) {
      ctx.issues.push({
        code: 'custom',
        path: ['password'],
        message: 'Password is required when registering with an email address',
        input: password,
      });

      return;
    }

    if (identifier.type === IdentifierType.PHONE && password !== undefined) {
      ctx.issues.push({
        code: 'custom',
        path: ['password'],
        message: 'Password must be omitted when registering with a phone number',
        input: password,
      });
    }
  });

export class UserRegisterDto extends createZodDto(userRegisterSchema) {}

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
