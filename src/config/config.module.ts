import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService, appConfig } from './app/index.js';
import { DatabaseConfigService, databaseConfig } from './database/index.js';
import { JwtConfigService, jwtConfig } from './jwt/index.js';
import { RedisConfigService, redisConfig } from './redis/index.js';
import { SecurityConfigService, securityConfig } from './security/index.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, securityConfig],
    }),
  ],
  providers: [
    AppConfigService,
    DatabaseConfigService,
    JwtConfigService,
    RedisConfigService,
    SecurityConfigService,
  ],
  exports: [
    AppConfigService,
    DatabaseConfigService,
    JwtConfigService,
    RedisConfigService,
    SecurityConfigService,
  ],
})
export class AppConfigModule {}
