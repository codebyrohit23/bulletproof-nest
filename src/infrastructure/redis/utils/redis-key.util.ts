import { REDIS_KEY_SEPARATOR } from '#/config/redis/index.js';

import type { RedisDomain } from '../constants/redis-key.constants.js';

/**
 * Joins a namespace and its segments into a key.
 *
 * Deliberately thin: the only rule it enforces is that a key starts with a
 * registered domain. Anything richer — tenant scoping, schema versions — is a
 * decision belonging to whoever owns that namespace, and `core/cache` has its
 * own builder for exactly that reason.
 *
 * No hash tags, matching the rule in `core/cache`: a tag forces every key
 * sharing it onto one cluster slot and buys nothing unless a single command
 * spans those keys. Whoever writes a multi-key script adds one there, where the
 * requirement is visible.
 *
 * Pure: no DI, no Redis, no request context.
 */
export function buildRedisKey(domain: RedisDomain, segments: readonly (string | number)[]): string {
  return [domain, ...segments.map(String)].join(REDIS_KEY_SEPARATOR);
}
