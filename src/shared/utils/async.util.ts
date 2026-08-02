/**
 * Generic async helpers. No DI, no framework, no domain knowledge.
 */

/**
 * Resolves after `milliseconds`.
 *
 * Used for backoff between retries and for polling a value another process is
 * expected to produce. Never use it to "wait for" something without also
 * bounding the number of waits — an unbounded poll is a hung request.
 */
export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
