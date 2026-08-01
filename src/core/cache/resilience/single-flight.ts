/**
 * Collapses concurrent loads of the same key into one.
 *
 * When a hot key expires, every in-flight request misses at the same moment and
 * they all call the loader — two hundred identical queries for one row. This
 * keeps the first promise and hands it to everyone else.
 *
 * In-process only, which covers the common case cheaply: the alternative is a
 * distributed lock, which costs a round trip on every miss and is only worth it
 * when the loader is genuinely expensive. Across pods the worst case is one
 * duplicate load per pod rather than per request.
 *
 * Deliberately not an `@Injectable()`: no dependencies, so it stays testable
 * without a Nest container.
 */
export class SingleFlight {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  async run<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);

    if (existing !== undefined) {
      return existing as Promise<T>;
    }

    /*
     * The entry is removed in `finally` rather than after resolution so a
     * rejected loader does not leave a permanently failing promise cached for
     * every subsequent caller.
     */
    const pending = loader().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, pending);

    return pending;
  }

  get size(): number {
    return this.inFlight.size;
  }
}
