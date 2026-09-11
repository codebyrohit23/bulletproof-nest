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

const TRUST_PROXY_KEYWORDS = ['loopback', 'linklocal', 'uniquelocal'];

const TRUST_PROXY_ADDRESS_PATTERN = /^[0-9a-f.:]+(\/\d{1,3})?$/i;

/**
 * `false` | `true` | a hop count | a list of addresses, CIDRs or keywords.
 */
export const trustProxyEnv = (defaultValue: 'true' | 'false') =>
  z
    .string()
    .default(defaultValue)
    .transform((value, ctx): boolean | number | string[] => {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'false' || normalized === 'true') {
        return normalized === 'true';
      }

      if (/^\d+$/.test(normalized)) {
        return Number(normalized);
      }

      const entries = parseCommaSeparated(value);

      const invalid = entries.filter(
        (entry) =>
          !TRUST_PROXY_KEYWORDS.includes(entry.toLowerCase()) &&
          !TRUST_PROXY_ADDRESS_PATTERN.test(entry),
      );

      if (entries.length === 0 || invalid.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `must be true, false, a hop count, or a list of addresses/CIDRs/${TRUST_PROXY_KEYWORDS.join('/')}`,
        });

        return z.NEVER;
      }

      return entries;
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
