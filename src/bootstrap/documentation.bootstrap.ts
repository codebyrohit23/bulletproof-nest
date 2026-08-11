import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppConfigService } from '#/config/app/index.js';
import { DOCUMENTATION_LOG_CONTEXT, buildApiDocuments, mountScalarReference } from '#/core/documentation/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

/**
 * Mounts an API reference per audience.
 *
 *     /docs        /docs/json         public API — versioned, web and mobile
 *     /docs/admin  /docs/admin/json   admin API  — first-party console only
 *
 * Both are sliced from one generation pass, so they cannot disagree.
 */
export function configureDocumentation(app: NestFastifyApplication): void {
  const appConfig = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);

  /*
   * Never in production, and this is the whole access control.
   *
   * An open admin reference publishes the entire administrative surface — every
   * route, every payload shape, every field name — to anyone who guesses the
   * URL. A hard-to-guess path is not a substitute. When these pages are wanted
   * in a deployed environment, the answer is authentication in front of them,
   * not a longer path.
   */
  if (appConfig.isProduction) {
    logger.info('API documentation disabled in production', {
      context: DOCUMENTATION_LOG_CONTEXT,
      operation: 'configureDocumentation',
    });

    return;
  }

  const documents = buildApiDocuments(app);

  for (const [audience, document] of documents) {
    mountScalarReference(app, audience, document);

    logger.info('API reference mounted', {
      context: DOCUMENTATION_LOG_CONTEXT,
      operation: 'configureDocumentation',
      metadata: {
        audience: audience.key,
        docs: audience.docsPath,
        spec: audience.specPath,
        routes: Object.keys(document.paths).length,
      },
    });
  }
}
