import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { configureShutdown } from '@/bootstrap/shutdown.bootstrap.js';
import { configureVersioning } from '@/bootstrap/versioning.bootstrap.js';

import { configureFastify } from './fastify.bootstrap.js';
import { configureHooks } from './hooks.bootstrap.js';
import { configureSecurity } from './security.bootstrap.js';

export async function bootstrapApplication(app: NestFastifyApplication): Promise<void> {
  /**
   * Bootstrap order (IMPORTANT)
   *
   * 1. Fastify plugins
   * 2. Security
   * 3. Hooks
   * 4. Versioning
   * 5. Swagger
   * 6. Shutdown hooks
   *
   * Filters, pipes, guards and interceptors are deliberately not registered
   * here — they are bound through `APP_FILTER` / `APP_PIPE` / `APP_INTERCEPTOR`
   * inside their own module so that dependency injection works. Bootstrap is
   * only for what Nest's container cannot do.
   */
  await configureFastify(app);
  await configureSecurity(app);

  app.useLogger(app.get(Logger));
  app.flushLogs();

  configureHooks(app);
  configureVersioning(app);
  // await configureSwagger(app);
  configureShutdown(app);
}
