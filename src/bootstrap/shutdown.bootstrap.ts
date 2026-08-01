import { ShutdownSignal } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppLoggerService } from '@/core/logger/index.js';

const SHUTDOWN_SIGNALS = [ShutdownSignal.SIGTERM, ShutdownSignal.SIGINT];
const FORCED_SHUTDOWN_TIMEOUT_MS = 10_000;
const LOG_CONTEXT = 'Bootstrap';

export function configureShutdown(app: NestFastifyApplication): void {
  app.enableShutdownHooks(SHUTDOWN_SIGNALS);

  const logger = app.get(AppLoggerService);

  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, () => {
      logger.info(`${signal} received — closing application`, {
        context: LOG_CONTEXT,
        operation: 'shutdown',
        metadata: { signal },
      });

      const forceExitTimer = setTimeout(() => {
        logger.fatal(new Error('Graceful shutdown timed out'), 'Forcing exit', {
          context: LOG_CONTEXT,
          operation: 'shutdown',
          metadata: { signal, timeoutMs: FORCED_SHUTDOWN_TIMEOUT_MS },
        });

        process.exit(1);
      }, FORCED_SHUTDOWN_TIMEOUT_MS);

      forceExitTimer.unref();
    });
  }
}
