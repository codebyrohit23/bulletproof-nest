import { Global, Module } from '@nestjs/common';
import { LoggerModule as NestjsPinoModule, type Params } from 'nestjs-pino';

import { AppConfigService } from '#/config/app/index.js';
import { AppConfigModule } from '#/config/index.js';
import { RequestContextService } from '#/core/context/index.js';

import { createLoggerConfig } from './logger.config.js';
import { createPinoHttpOptions } from './logger.factory.js';
import { AppLoggerService } from './logger.service.js';

@Global()
@Module({
  imports: [
    NestjsPinoModule.forRootAsync({
      imports: [AppConfigModule],

      inject: [AppConfigService, RequestContextService],

      useFactory: (
        appConfigService: AppConfigService,
        requestContext: RequestContextService,
      ): Params => ({
        pinoHttp: createPinoHttpOptions(createLoggerConfig(appConfigService), requestContext),
      }),
    }),
  ],

  providers: [AppLoggerService],

  exports: [AppLoggerService],
})
export class AppLoggerModule {}
