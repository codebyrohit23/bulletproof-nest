import { performance } from 'node:perf_hooks';

import { Prisma } from '@prisma/client';

import type { AppLoggerService } from '#/core/logger/index.js';

import { PRISMA_QUERY_LOG_CONTEXT } from '../constants/prisma.constants.js';

/**
 * Times every operation and flags slow ones.
 *
 * `args` is never logged. It carries password hashes, refresh tokens,
 * verification codes and customer PII — none of which belongs in a log stream.
 * Only the model, the operation and the duration are recorded.
 */
export function createQueryLoggingExtension(logger: AppLoggerService, slowQueryThresholdMs: number) {
  return Prisma.defineExtension({
    name: 'query-logging',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startedAt = performance.now();

          try {
            return await query(args);
          } finally {
            const durationMs = Number((performance.now() - startedAt).toFixed(1));
            const target = `${model ?? 'raw'}.${operation}`;

            if (durationMs >= slowQueryThresholdMs) {
              logger.warn(`Slow query: ${target} took ${durationMs}ms`, {
                context: PRISMA_QUERY_LOG_CONTEXT,
                metadata: { model, operation, durationMs, slowQueryThresholdMs },
              });
            } else {
              logger.debug(`${target} — ${durationMs}ms`, {
                context: PRISMA_QUERY_LOG_CONTEXT,
                metadata: { model, operation, durationMs },
              });
            }
          }
        },
      },
    },
  });
}
