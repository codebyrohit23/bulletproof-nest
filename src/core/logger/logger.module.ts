import { Global, Module } from '@nestjs/common';
import { LoggerModule as NestjsPinoModule, type Params } from 'nestjs-pino';

import { AppConfigService } from '#/config/app/index.js';
import { AppConfigModule } from '#/config/index.js';

import { createLoggerConfig } from './logger.config.js';
import { AppLoggerService } from './logger.service.js';

@Global()
@Module({
  imports: [
    NestjsPinoModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService): Params => {
        const loggerConfig = createLoggerConfig(appConfigService);

        const pinoHttp: NonNullable<Params['pinoHttp']> = {
          level: loggerConfig.level,

          redact: [...loggerConfig.redact],

          autoLogging: true,

          ...(appConfigService.isProduction
            ? {}
            : {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    singleLine: false,
                    ignore: 'pid,hostname',
                  },
                },
              }),
        };

        return {
          pinoHttp,
        };
      },
    }),
  ],

  providers: [AppLoggerService],

  exports: [AppLoggerService],
})
export class AppLoggerModule {}
