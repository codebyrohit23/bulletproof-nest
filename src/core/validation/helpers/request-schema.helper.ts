import { z } from 'zod';

/**
 * Schema builders that encode this application's request-validation policy.
 *
 * The policy is expressed here rather than configured on the pipe because Zod
 * decides unknown-key handling per schema, not globally. Putting it in a named
 * helper makes the choice visible at every call site instead of hidden in
 * module wiring.
 */

/**
 * For request **bodies**. Rejects unknown keys.
 *
 * A typo like `emial` would otherwise be silently dropped and the request would
 * succeed, leaving the user believing they saved something they did not. That
 * is invisible data loss, and it is worth a 422 to prevent.
 *
 * Mirrors the `forbidNonWhitelisted: true` this project previously ran under
 * `class-validator`.
 */
export function requestObject<T extends z.ZodRawShape>(shape: T) {
  return z.strictObject(shape);
}

/**
 * For **query strings**. Ignores unknown keys.
 *
 * Deliberately more forgiving than bodies: cache-busters (`?_t=1699…`),
 * analytics parameters (`?utm_source=…`) and link-tracking noise are routine,
 * outside the caller's control, and harmless. Rejecting them would break real
 * clients for no gain.
 */
export function queryObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}
