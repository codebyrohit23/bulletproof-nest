import { IdentifierType } from '@prisma/client';
import { z } from 'zod';

import { emailSchema, lookupEmailSchema } from './email.schema.js';
import { lookupPhoneSchema, phoneSchema } from './phone.schema.js';

const buildIdentifierSchema = <
  TEmail extends z.ZodType<string, string>,
  TPhone extends z.ZodType<string, string>,
>(
  email: TEmail,
  phone: TPhone,
) =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal(IdentifierType.EMAIL), value: email }),
    z.object({ type: z.literal(IdentifierType.PHONE), value: phone }),
  ]);

export const identifierSchema = buildIdentifierSchema(emailSchema, phoneSchema);

export const lookupIdentifierSchema = buildIdentifierSchema(lookupEmailSchema, lookupPhoneSchema);

export type IdentifierInput = z.infer<typeof identifierSchema>;
