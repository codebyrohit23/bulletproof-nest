import { IdentifierType } from '@prisma/client';
import { z } from 'zod';

import { IDENTIFIER_MAX_LENGTH, PHONE_E164_PATTERN } from '../constants/index.js';

export const emailIdentifierSchema = z.object({
  type: z.literal(IdentifierType.EMAIL),

  value: z.string().trim().toLowerCase().pipe(z.email().max(IDENTIFIER_MAX_LENGTH)),
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
