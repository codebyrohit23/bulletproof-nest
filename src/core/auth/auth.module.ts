import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AdminAuthenticator, UserAuthenticator } from './authenticators/index.js';
import { ApiAuthGuard } from './guards/api-auth.guard.js';
import type { AuthModuleOptions } from './interfaces/index.js';

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: options.imports,
      providers: [
        UserAuthenticator,
        AdminAuthenticator,
        ApiAuthGuard,
        { provide: APP_GUARD, useExisting: ApiAuthGuard },
      ],
    };
  }
}
