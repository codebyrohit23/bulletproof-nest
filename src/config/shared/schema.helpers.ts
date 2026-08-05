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
 *
 * Only `true` and `false` are accepted. `1`/`0` would be a second spelling of
 * the same thing, and one canonical form means an `.env` file reads the same
 * way everywhere.
 */
export const booleanEnv = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

/**
 * A positive integer with a default, used for ports, pool sizes and timeouts.
 */
export const positiveIntEnv = (defaultValue: number) => z.coerce.number().int().positive().default(defaultValue);

/**
 * A non-negative integer with a default.
 *
 * Distinct from `positiveIntEnv` because some settings use `0` as a meaningful
 * sentinel — "unlimited", "disabled" — which a positive-only schema rejects.
 */
export const nonNegativeIntEnv = (defaultValue: number) => z.coerce.number().int().min(0).default(defaultValue);

/**
 * A comma-separated list constrained to a fixed set of allowed values.
 */
export const enumListEnv = <const T extends readonly [string, ...string[]]>(values: T, defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform(parseCommaSeparated)
    .pipe(z.array(z.enum(values)));
