import { CACHE_TTL_JITTER_RATIO } from '../constants/cache.constants.js';

/**
 * Pure helpers for what goes on and off the wire.
 *
 * ---------------------------------------------------------------------------
 * THE SERIALIZATION RULE
 * ---------------------------------------------------------------------------
 * Only plain, JSON-safe values may be cached — view models and DTOs, not
 * entities.
 *
 * `JSON.stringify` is lossy in ways that only appear on a cache **hit**:
 *
 *     Date   → string      `user.createdAt.getTime()` throws
 *     BigInt → throws
 *     Map    → {}
 *     Set    → {}
 *     undefined property → dropped
 *
 * A cold cache in development passes; a warm cache in production fails. There
 * is no revive step on purpose: reviving guesses, and guessing wrong on a
 * string that merely looks like a date is worse than the rule. Map at the
 * module boundary and cache the mapped result.
 */

export function serialize(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Returns `null` rather than throwing on malformed input.
 *
 * A corrupted or truncated entry — a partial write, a value left by an older
 * schema — must read as a miss and be reloaded, never surface as a 500.
 */
export function deserialize<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

/**
 * Spreads expiry either side of the requested TTL.
 *
 * Ten entries written in one request otherwise expire in the same millisecond
 * and stampede the database together.
 */
export function applyTtlJitter(ttlSeconds: number): number {
  const jitter = ttlSeconds * CACHE_TTL_JITTER_RATIO * (Math.random() * 2 - 1);

  return Math.max(1, Math.round(ttlSeconds + jitter));
}
