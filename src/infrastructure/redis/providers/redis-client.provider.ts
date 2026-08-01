import { Redis } from 'ioredis';

import type { RedisConfigService } from '@/config/redis/index.js';

import { REDIS_CLIENT, type RedisClientName } from '../constants/redis.constants.js';
import { createReconnectStrategy } from '../utils/reconnect.util.js';

/**
 * Builds one named ioredis client.
 *
 * The only place in the codebase that constructs a connection. Everything else
 * receives a client from `RedisService`, which is what keeps a future move to
 * Redis Cluster a change to this file alone.
 *
 * If that day comes, three things change beyond the constructor: `SCAN` must be
 * run per node, multi-key commands need every key in one hash slot, and
 * pipelines cannot span slots.
 *
 * The options are built as an inline literal rather than a typed `RedisOptions`
 * variable — under `exactOptionalPropertyTypes`, that named type's optional
 * members are not assignable to the constructor's parameter.
 */
export function createRedisClient(name: RedisClientName, config: RedisConfigService): Redis {
  const isQueueClient = name === REDIS_CLIENT.QUEUE;

  return new Redis(config.url, {
    connectTimeout: config.connectTimeoutMs,

    commandTimeout: config.commandTimeoutMs,

    retryStrategy: createReconnectStrategy(config.reconnect),

    /*
     * Commands issued before the connection is ready are queued rather than
     * rejected. Without it, anything firing during startup or a brief reconnect
     * fails outright instead of simply being slow.
     */
    enableOfflineQueue: true,

    /*
     * BullMQ requires `null` here and refuses to start otherwise — its blocking
     * commands have no meaningful retry limit.
     */
    maxRetriesPerRequest: isQueueClient ? null : config.maxRetriesPerRequest,

    ...(isQueueClient
      ? {
          /*
           * The ready check interferes with how BullMQ manages its own
           * connections.
           */
          enableReadyCheck: false,

          /*
           * Deliberately no `keyPrefix`. BullMQ builds keys inside Lua scripts
           * that are unaware of ioredis prefixing, so setting one corrupts
           * them. Environment separation for queues goes through BullMQ's own
           * `prefix` option — which is also where the `{...}` hash tag it needs
           * for cluster belongs.
           */
        }
      : { keyPrefix: config.keyPrefix }),

    ...(config.tls !== undefined ? { tls: config.tls } : {}),
  });
}
