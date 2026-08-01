import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { Pool } from 'pg';

/**
 * Every Prisma log level is emitted as an **event**, never to stdout.
 *
 * `emit: 'stdout'` writes unstructured text straight past the pino pipeline,
 * which leaves the database layer invisible to log aggregation in production.
 * `prisma-log.provider.ts` decides which of these events are actually logged.
 */
const PRISMA_LOG_DEFINITIONS = [
  { emit: 'event', level: 'query' },
  { emit: 'event', level: 'info' },
  { emit: 'event', level: 'warn' },
  { emit: 'event', level: 'error' },
] as const;

/**
 * Builds the base client. Extensions are applied separately by the registry,
 * because `$on` is not available on an extended client — log handlers must be
 * attached to this instance first.
 */
export function createPrismaClient(pool: Pool) {
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: [...PRISMA_LOG_DEFINITIONS],
  });
}
