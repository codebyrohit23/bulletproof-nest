import type { PrismaLogLevel } from '#/config/database/index.js';
import type { AppLoggerService } from '#/core/logger/index.js';

import { PRISMA_QUERY_LOG_CONTEXT } from '../constants/prisma.constants.js';
import type { BasePrismaClient } from '../types/prisma.types.js';

/**
 * Routes Prisma's own log events into the application logger.
 *
 * `query` events carry a `params` field containing the actual bound values —
 * password hashes, tokens, PII. It is never logged. The SQL text is safe
 * because values appear only as placeholders.
 *
 * Which levels are active is driven by `POSTGRES_LOG_LEVEL`, so production can
 * run `warn,error` while development runs everything.
 */
export function registerPrismaLogHandlers(
  client: BasePrismaClient,
  logger: AppLoggerService,
  levels: readonly PrismaLogLevel[],
): void {
  const enabled = new Set<PrismaLogLevel>(levels);

  if (enabled.has('query')) {
    client.$on('query', (event) => {
      logger.debug('Prisma query', {
        context: PRISMA_QUERY_LOG_CONTEXT,
        metadata: {
          query: event.query,
          durationMs: event.duration,
          target: event.target,
        },
      });
    });
  }

  if (enabled.has('info')) {
    client.$on('info', (event) => {
      logger.info(event.message, {
        context: PRISMA_QUERY_LOG_CONTEXT,
        metadata: { target: event.target },
      });
    });
  }

  if (enabled.has('warn')) {
    client.$on('warn', (event) => {
      logger.warn(event.message, {
        context: PRISMA_QUERY_LOG_CONTEXT,
        metadata: { target: event.target },
      });
    });
  }

  if (enabled.has('error')) {
    client.$on('error', (event) => {
      logger.error(new Error(event.message), 'Prisma error', {
        context: PRISMA_QUERY_LOG_CONTEXT,
        metadata: { target: event.target },
      });
    });
  }
}
