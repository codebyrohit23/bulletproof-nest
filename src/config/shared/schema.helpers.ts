import { z } from 'zod';

import { parseCommaSeparated } from './utils.js';

/**
 * Reusable Zod builders for environment variables.
 *
 * Environment values are always strings, so every schema in `config/*` must go
 * through one of these helpers rather than reaching for `z.coerce.*` directly.
 */

/**
 * `z.coerce.boolean()` is `Boolean(value)`, which makes the string `'false'`
 * evaluate to `true`. Every boolean environment variable must use this instead.
 */
export const booleanEnv = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false', '1', '0'])
    .default(defaultValue)
    .transform((value) => value === 'true' || value === '1');

/**
 * A positive integer with a default, used for ports, pool sizes and timeouts.
 */
export const positiveIntEnv = (defaultValue: number) => z.coerce.number().int().positive().default(defaultValue);

/**
 * A comma-separated list constrained to a fixed set of allowed values.
 */
export const enumListEnv = <const T extends readonly [string, ...string[]]>(values: T, defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform(parseCommaSeparated)
    .pipe(z.array(z.enum(values)));
