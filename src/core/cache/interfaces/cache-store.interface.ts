/**
 * The minimal surface `CacheService` needs from a backing store.
 *
 * Deals in **strings**, never objects — serialization belongs to the service so
 * every store behaves identically. A store that returned live objects would
 * hide the JSON round-trip entirely, and a `Date` that survives in tests but
 * arrives as a string in production is the most common cache bug there is.
 *
 * Implementations may throw. `CacheService` catches, because a cache failure
 * must degrade to a miss rather than fail the request.
 */
export interface CacheStore {
  get(key: string): Promise<string | null>;

  set(key: string, value: string, ttlSeconds: number): Promise<void>;

  delete(keys: readonly string[]): Promise<void>;

  /**
   * Removes every key under `prefix` and returns how many were removed.
   *
   * Must use `SCAN`, never `KEYS` — `KEYS` is O(N) and blocks the server for
   * the duration, which is survivable on a laptop and an outage in production.
   */
  deleteByPrefix(prefix: string): Promise<number>;
}
