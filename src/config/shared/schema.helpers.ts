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
 * A PEM key delivered base64-encoded, decoded back to PEM for the config layer.
 *
 * Keys are wrapped in base64 because a PEM is multi-line, and `.env` files,
 * `docker --env-file` and hosted secret stores each mangle embedded newlines
 * differently. The usual workaround — storing `\n` escapes and calling
 * `.replace(/\\n/g, '\n')` — breaks on whichever platform does not escape them.
 * One opaque line behaves identically everywhere and round-trips exactly.
 *
 * `Buffer.from(value, 'base64')` never throws: it silently skips characters
 * outside the alphabet and truncates a malformed tail. So the decode cannot be
 * the check — the banner is. Anything that is not really base64 decodes to
 * bytes that do not start with a PEM banner and is rejected here.
 *
 * Deliberately has no default. Every other helper takes one; a signing key that
 * silently falls back to a value baked into the source is the one case where a
 * default is indistinguishable from having no security at all.
 */
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

/**
 * A comma-separated list constrained to a fixed set of allowed values.
 */
export const enumListEnv = <const T extends readonly [string, ...string[]]>(values: T, defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform(parseCommaSeparated)
    .pipe(z.array(z.enum(values)));
