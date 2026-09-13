import type { AppLoggerService } from '#/core/logger/index.js';

import type { BasePrismaClient } from '../types/prisma.types.js';

import { createQueryLoggingExtension } from './query-logging.extension.js';
import { createSoftDeleteExtension } from './soft-delete.extension.js';

export interface PrismaExtensionDependencies {
  readonly logger: AppLoggerService;

  readonly slowQueryThresholdMs: number;
}

export function applyPrismaExtensions(
  client: BasePrismaClient,
  dependencies: PrismaExtensionDependencies,
) {
  return client
    .$extends(createQueryLoggingExtension(dependencies.logger, dependencies.slowQueryThresholdMs))
    .$extends(createSoftDeleteExtension());
}
