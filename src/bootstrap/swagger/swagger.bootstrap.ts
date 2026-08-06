import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppConfigService } from '#/config/app/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { buildAdminDocumentConfig } from './documents/admin-document.js';
import { buildUserDocumentConfig } from './documents/user-document.js';
import { ADMIN_PATH_SEGMENT, SWAGGER_PATH } from './swagger.constants.js';
import { filterDocumentPaths, pruneUnusedTags } from './utils/document.util.js';

const SWAGGER_LOG_CONTEXT = 'Swagger';

/**
 * Mounts two documents:
 *
 *   /docs        the public API      — versioned, for web and mobile
 *   /docs/admin  the admin API       — unversioned, first-party console only
 *
 * Both are sliced from **one** generation pass, so they cannot drift.
 */
export function configureSwagger(app: INestApplication): void {
  const appConfig = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);

  /*
   * Never in production. An open `/docs/admin` publishes the entire
   * administrative surface — every route, every payload shape — to anyone who
   * guesses the URL. Expose it there only behind authentication, deliberately.
   */
  if (appConfig.isProduction) {
    logger.info('API documentation disabled in production', {
      context: SWAGGER_LOG_CONTEXT,
      operation: 'configureSwagger',
    });

    return;
  }

  /*
   * `cleanupOpenApiDoc` is required because DTOs are Zod schemas via
   * `createZodDto`, not class-validator classes. Without it every request body
   * renders as an empty object.
   */
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, buildUserDocumentConfig()));

  const userDocument = pruneUnusedTags(filterDocumentPaths(document, (path) => !path.includes(ADMIN_PATH_SEGMENT)));

  const adminDocument = pruneUnusedTags({
    ...filterDocumentPaths(document, (path) => path.includes(ADMIN_PATH_SEGMENT)),
    info: buildAdminDocumentConfig().info,
  });

  SwaggerModule.setup(SWAGGER_PATH.USER, app, userDocument, {
    jsonDocumentUrl: `${SWAGGER_PATH.USER}/json`,
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none' },
  });

  SwaggerModule.setup(SWAGGER_PATH.ADMIN, app, adminDocument, {
    jsonDocumentUrl: `${SWAGGER_PATH.ADMIN}/json`,
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none' },
  });

  logger.info('API documentation mounted', {
    context: SWAGGER_LOG_CONTEXT,
    operation: 'configureSwagger',
    metadata: {
      user: `/${SWAGGER_PATH.USER}`,
      admin: `/${SWAGGER_PATH.ADMIN}`,
      userRoutes: Object.keys(userDocument.paths).length,
      adminRoutes: Object.keys(adminDocument.paths).length,
    },
  });
}
