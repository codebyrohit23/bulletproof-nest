export const CACHE_STORE_LOG_CONTEXT = 'CacheStore';

/**
 * How many keys `SCAN` is asked to examine per iteration.
 *
 * A hint, not a page size — Redis may return more or fewer. It lives here
 * rather than with the cache policy constants because it tunes the scan loop
 * and nothing above this folder can act on it: `core/cache` asks for a prefix
 * to be cleared and does not care how many round trips that takes.
 */
export const CACHE_STORE_SCAN_COUNT = 500;
