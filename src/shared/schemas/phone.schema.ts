import { z } from 'zod';

import { PHONE_INPUT_MAX_LENGTH, VERIFIABLE_PHONE_TYPES } from '../constants/index.js';
import { parsePhone } from '../utils/index.js';

// Replaces a bare E.164 regex, which accepted structurally valid but
// unallocated numbers such as `+10000000000`.
const parsedPhoneSchema = z
  .string()
  .trim()
  .max(PHONE_INPUT_MAX_LENGTH, `Phone number must be at most ${PHONE_INPUT_MAX_LENGTH} characters`)
  .transform((value, ctx) => {
    const phone = parsePhone(value);

    if (!phone) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid phone number with country code, for example +919876543210',
      });

      return z.NEVER;
    }

    return phone;
  });

// For lookups. Any valid number, returned in E.164.
export const lookupPhoneSchema = parsedPhoneSchema.transform((phone) => phone.e164);

// For flows that ADD a number. A code sent to a landline never arrives and the
// SMS is billed anyway.
export const phoneSchema = parsedPhoneSchema
  .refine((phone) => VERIFIABLE_PHONE_TYPES.has(phone.type), {
    message: 'Enter a mobile number',
  })
  .transform((phone) => phone.e164);
