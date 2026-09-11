import { z } from 'zod';

import { parseCommaSeparated } from './utils.js';

export const optionalEnv = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const booleanEnv = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

export const positiveIntEnv = (defaultValue: number) =>
  z.coerce.number().int().positive().default(defaultValue);

export const nonNegativeIntEnv = (defaultValue: number) =>
  z.coerce.number().int().min(0).default(defaultValue);

export const base64PemEnv = (header: string) =>
  z
    .string()
    .min(1)
    .transform((value, ctx) => {
      const decoded = Buffer.from(value, 'base64').toString('utf8');

      if (!decoded.startsWith(header)) {
        ctx.addIssue({
          code: 'custom',
          message: `must be a base64-encoded PEM beginning with "${header}"`,
        });

        return z.NEVER;
      }

      return decoded;
    });

export const enumListEnv = <const T extends readonly [string, ...string[]]>(
  values: T,
  defaultValue: string,
) =>
  z
    .string()
    .default(defaultValue)
    .transform(parseCommaSeparated)
    .pipe(z.array(z.enum(values)));
