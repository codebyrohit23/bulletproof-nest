import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService, appConfig } from './app/index.js';
import { DatabaseConfigService, databaseConfig } from './database/index.js';
import { EmailConfigService, emailConfig } from './email/index.js';
import { JwtConfigService, jwtConfig } from './jwt/index.js';
import { RedisConfigService, redisConfig } from './redis/index.js';
import { SecurityConfigService, securityConfig } from './security/index.js';
import { SeedConfigService, seedConfig } from './seed/index.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        appConfig,
        databaseConfig,
        emailConfig,
        jwtConfig,
        redisConfig,
        seedConfig,
        securityConfig,
      ],
    }),
  ],
  providers: [
    AppConfigService,
    DatabaseConfigService,
    EmailConfigService,
    JwtConfigService,
    RedisConfigService,
    SeedConfigService,
    SecurityConfigService,
  ],
  exports: [
    AppConfigService,
    DatabaseConfigService,
    EmailConfigService,
    JwtConfigService,
    RedisConfigService,
    SeedConfigService,
    SecurityConfigService,
  ],
})
export class AppConfigModule {}
