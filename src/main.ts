import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { bootstrapApplication } from '#/bootstrap/index.js';
import { AppConfigService } from '#/config/app/index.js';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
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
