import { IdentifierType } from '@prisma/client';
import { z } from 'zod';

import { PHONE_E164_PATTERN } from '../constants/index.js';

import { emailSchema } from './email.schema.js';

export const emailIdentifierSchema = z.object({
  type: z.literal(IdentifierType.EMAIL),

  value: emailSchema,
});

export const phoneIdentifierSchema = z.object({
  type: z.literal(IdentifierType.PHONE),

  value: z
    .string()
    .trim()
    .regex(PHONE_E164_PATTERN, 'must be in E.164 format, for example +919876543210'),
});

export const identifierSchema = z.discriminatedUnion('type', [
  emailIdentifierSchema,
  phoneIdentifierSchema,
]);

export type IdentifierInput = z.infer<typeof identifierSchema>;
