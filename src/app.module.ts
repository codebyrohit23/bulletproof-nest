import { Module } from '@nestjs/common';

import { AppConfigModule } from '#/config/index.js';
import { AuthModule } from '#/core/auth/index.js';
import { CacheModule } from '#/core/cache/index.js';
import { EmailModule } from '#/core/communication/email/index.js';
import { ContextModule } from '#/core/context/index.js';
import { CsrfModule } from '#/core/csrf/index.js';
import { ExceptionModule } from '#/core/exceptions/index.js';
import { InterceptorModule } from '#/core/interceptors/index.js';
import { JwtModule } from '#/core/jwt/index.js';
import { AppLoggerModule } from '#/core/logger/index.js';
import { RateLimitModule } from '#/core/rate-limit/index.js';
import { SecurityModule } from '#/core/security/index.js';
import { ValidationModule } from '#/core/validation/index.js';
import { PrismaModule } from '#/infrastructure/database/prisma/index.js';
import { QueueModule, QueueWorkerModule } from '#/infrastructure/queue/index.js';
import { RedisModule } from '#/infrastructure/redis/index.js';
import { AdminAuthModule } from '#/modules/admin-auth/index.js';
import { AdminsModule } from '#/modules/admins/index.js';
import { CommunicationModule } from '#/modules/communication/index.js';
import { HealthModule } from '#/modules/health/index.js';
import { UserAuthModule } from '#/modules/user-auth/index.js';
import { UsersModule } from '#/modules/users/index.js';

@Module({
  imports: [
    AppConfigModule,
    ContextModule,
    AppLoggerModule,
    PrismaModule,
    RedisModule,
    CacheModule,

    /*
     * Before `RateLimitModule`: global guards run in registration order, and a
     * cross-site request should cost two header reads rather than a Redis round
     * trip it was never entitled to.
     */
    CsrfModule,
    RateLimitModule,
    QueueModule,
    QueueWorkerModule,
    ExceptionModule,
    InterceptorModule,
    ValidationModule,
    SecurityModule,
    JwtModule,

    HealthModule,
    UsersModule,
    UserAuthModule,
    AdminsModule,
    AdminAuthModule,
    CommunicationModule,

    AuthModule.forRoot({ imports: [UserAuthModule, AdminAuthModule] }),
    EmailModule.forRoot({ imports: [CommunicationModule] }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
