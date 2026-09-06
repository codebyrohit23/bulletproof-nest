import { CACHE_ENVELOPE_VERSION, CACHE_TTL_JITTER_RATIO } from '../constants/cache.constants.js';

/**
 * Pure helpers for what goes on and off the wire.
 *
 * ---------------------------------------------------------------------------
 * WHY VALUES ARE WRAPPED
 * ---------------------------------------------------------------------------
 * Everything is stored inside an envelope rather than written bare, because
 * `null` has to mean two different things and a bare payload cannot carry both:
 *
 *     nothing stored          the key is absent          → load it
 *     null stored             the loader said "no row"   → do not load it again
 *
 * Written bare, a negatively-cached `null` reads back as the string `"null"`,
 * parses to `null`, and is then indistinguishable from a miss — so the entry is
 * written, read, and ignored on every single request. Negative caching silently
 * does nothing, and the hit counter reports a hit while the database is queried
 * anyway. That is exactly the bug this envelope exists to make impossible.
 *
 * The presence of the envelope *is* the hit. What it carries may be `null`.
 *
 * `__cv` is checked rather than assumed, so a payload written before this
 * change — or by anything else sharing the keyspace — reads as a miss and is
 * reloaded rather than being misinterpreted. That also makes the rollout
 * self-healing: old entries are simply rewritten as they are touched.
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

/**
 * What a stored entry looks like once parsed.
 *
 * Returned instead of a bare value so callers can tell "cached, and the answer
 * is nothing" from "not cached".
 */
export interface CacheEnvelope<T> {
  readonly v: T;
}

interface StoredEnvelope {
  readonly __cv: unknown;
  readonly v: unknown;
}

/**
 * `undefined` is normalised to `null` on the way in.
 *
 * `JSON.stringify(undefined)` returns `undefined` rather than a string, so
 * without this the declared return type is a lie and the store is handed a
 * non-string it converts to the literal text `undefined` — which then fails to
 * parse on the way back out.
 */
export function serialize<T>(value: T): string {
  return JSON.stringify({ __cv: CACHE_ENVELOPE_VERSION, v: value ?? null });
}

/**
 * Returns `null` for anything that is not a readable entry of this version.
 *
 * A corrupted or truncated payload, a partial write, or a value left by an
 * older release must read as a miss and be reloaded — never surface as a 500,
 * and never be handed to a caller as though it were the shape it asked for.
 */
export function deserialize<T>(payload: string): CacheEnvelope<T> | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const stored = parsed as StoredEnvelope;

  if (stored.__cv !== CACHE_ENVELOPE_VERSION) {
    return null;
  }

  return { v: (stored.v ?? null) as T };
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
