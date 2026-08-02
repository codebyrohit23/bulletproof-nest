/**
 * Named connections.
 *
 * One client cannot serve all three roles:
 *
 * - `QUEUE` needs `maxRetriesPerRequest: null` because BullMQ refuses to start
 *   otherwise, and its blocking commands (`BRPOPLPUSH`) occupy a connection for
 *   their whole duration — sharing it would stall every cache read behind them.
 * - `SUBSCRIBER` is put into subscriber mode by Redis, after which the
 *   connection accepts no ordinary commands at all.
 * - `DEFAULT` serves cache, locks and rate limiting.
 */
export const REDIS_CLIENT = {
  DEFAULT: 'default',
  QUEUE: 'queue',
  SUBSCRIBER: 'subscriber',
} as const;

export type RedisClientName = (typeof REDIS_CLIENT)[keyof typeof REDIS_CLIENT];

export const REDIS_LOG_CONTEXT = 'RedisService';

export const REDIS_HEALTH_KEY = 'redis';

/**
 * Health probes run far more often than ordinary traffic, so they get their own
 * short deadline rather than inheriting the command timeout.
 */
export const REDIS_HEALTH_TIMEOUT_MS = 2_000;

/**
 * Fraction of the computed reconnect delay applied as random jitter.
 *
 * Without it every replica reconnects on the same schedule and stampedes an
 * instance that is still coming back up.
 */
export const REDIS_RECONNECT_JITTER_RATIO = 0.2;

export const REDIS_PING_REPLY = 'PONG';

/**
 * Compare-and-delete, so a lock is only released by the process that owns it.
 *
 * `DEL` alone is unsafe: a holder that overran its TTL would delete a lock
 * another process has since acquired. The read and the delete must be one
 * atomic step, which on Redis means a script.
 */
export const REDIS_LOCK_RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;
