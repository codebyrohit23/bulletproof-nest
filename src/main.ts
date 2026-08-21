import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { bootstrapApplication } from '#/bootstrap/index.js';
import { AppConfigService } from '#/config/app/index.js';
import { resolveRequestId } from '#/core/context/index.js';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      /**
       * Fastify's own logger stays off — `nestjs-pino` owns log output, and two
       * loggers on one request produce two descriptions of it that drift apart.
       */
      logger: false,

      /**
       * Runs before every hook and middleware, so the id it returns is the one
       * Fastify, `pino-http` and `RequestContextMiddleware` all end up using.
       * Replaces Fastify's default `req-1`, `req-2` counter, which restarts
       * with the process and is therefore not unique across deploys.
       */
      genReqId: resolveRequestId,
    }),
    {
      bufferLogs: true,
    },
  );

  const appConfig = app.get(AppConfigService);

  await bootstrapApplication(app);

  await app.listen({
    host: appConfig.host,
    port: appConfig.port,
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
