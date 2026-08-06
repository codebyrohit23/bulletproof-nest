import type { AppLoggerService } from '#/core/logger/index.js';

import type { BasePrismaClient } from '../types/prisma.types.js';

import { createQueryLoggingExtension } from './query-logging.extension.js';
import { createSoftDeleteExtension } from './soft-delete.extension.js';

export interface PrismaExtensionDependencies {
  readonly logger: AppLoggerService;

  readonly slowQueryThresholdMs: number;
}

/**
 * Applies every extension, in order.
 *
 * **Order is behaviour.** `$extends` wraps, so the extension applied first sits
 * outermost and sees the call before the ones after it:
 *
 * 1. `query-logging` — outermost, so the duration it records is the true total
 *    including the work every inner extension does.
 * 2. `soft-delete`   — inside it, so a deleted row can never be reached by a
 *    read no matter what happens further in.
 *
 * Adding an extension means deciding where it belongs in this list, which is
 * why they are composed here rather than inline in the client provider.
 *
 * Primary keys are deliberately not handled here. `uuidv7()` is a column
 * DEFAULT in the schema, so the database fills it for every writer — Prisma,
 * raw SQL, seeds and imports alike. An extension would only have covered the
 * first of those.
 */
export function applyPrismaExtensions(client: BasePrismaClient, dependencies: PrismaExtensionDependencies) {
  return client
    .$extends(createQueryLoggingExtension(dependencies.logger, dependencies.slowQueryThresholdMs))
    .$extends(createSoftDeleteExtension());
}
