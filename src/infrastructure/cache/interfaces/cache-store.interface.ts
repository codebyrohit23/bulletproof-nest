/**
 * One entry as the store writes it.
 *
 * A plain interface, not an abstract class: nothing injects this and nothing
 * binds it. It is a data shape, and a shape costs nothing at runtime.
 */
export interface CacheStoreEntry {
  readonly key: string;

  readonly value: string;

  readonly ttlSeconds: number;
}

/**
 * Storing strings under keys, and nothing else.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ABSTRACTION LIVES IN `infrastructure` AND NOT IN `core`
 * ---------------------------------------------------------------------------
 * Reads, writes, pipelines and `SCAN` are storage mechanics, not policy. TTLs,
 * jitter, tenant scoping, serialization, negative caching, stampede protection
 * and the circuit breaker are `core/cache` decisions, and none of them need to
 * know whether the bytes land in Redis, in a process-local `Map`, or in a
 * two-tier arrangement of both.
 *
 * So the seam is here: a second backend is one new class in this folder and
 * zero lines changed in `core/cache`. Same arrangement as `RateLimitStore`,
 * and for the same reason.
 *
 * ---------------------------------------------------------------------------
 * WHY AN ABSTRACT CLASS AND NOT AN INTERFACE
 * ---------------------------------------------------------------------------
 * A TypeScript interface is erased at compile time, so it has no runtime value
 * and cannot be an injection token. Expressing this as an interface would mean
 * a separate `Symbol`, an `@Inject()` at every call site, and — worst of all —
 * no compiler check that the bound provider actually satisfies the contract,
 * because a `Symbol` and a class have no type relationship.
 *
 * An abstract class is a type *and* a runtime token at once. `{ provide:
 * CacheStore, useClass: … }` is type-checked, so a provider that drops
 * `deleteByPrefix` or changes a signature fails the build rather than the
 * request.
 *
 * This is exactly what the previous shape got wrong: `CacheStore` was declared
 * as an interface, `RedisCacheStore` was declared to implement it, and then
 * `CacheService` injected `RedisCacheStore` directly. The contract existed as
 * documentation and never as a seam — swapping the backend still meant editing
 * the policy layer.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS NOT HERE
 * ---------------------------------------------------------------------------
 * No `remember`, no TTL jitter, no envelope, no metrics. Values arrive as
 * strings already serialized and leave the same way, because deciding how an
 * object becomes bytes — and what a `null` in the cache means — is policy.
 *
 * Failures raise rather than resolving to `null`. A store that swallowed its
 * own outage would be indistinguishable from a cache miss, and `CacheService`
 * would keep asking a dead Redis on every request instead of opening its
 * circuit.
 */
export abstract class CacheStore {
  abstract get(key: string): Promise<string | null>;

  /**
   * Order matches `keys`, with `null` in the slot of anything missing, so the
   * caller can zip the two lists without a second lookup.
   */
  abstract getMany(keys: readonly string[]): Promise<(string | null)[]>;

  abstract set(key: string, value: string, ttlSeconds: number): Promise<void>;

  abstract setMany(entries: readonly CacheStoreEntry[]): Promise<void>;

  abstract delete(keys: readonly string[]): Promise<void>;

  /**
   * Removes every key under `prefix` and reports how many went.
   *
   * The prefix is supplied by whoever owns the key layout; this only matches
   * and deletes.
   */
  abstract deleteByPrefix(prefix: string): Promise<number>;
}
