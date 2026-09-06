import { type DynamicModule, Module } from '@nestjs/common';

import type { AuthModuleOptions } from '#/core/auth/interfaces/auth-session.interface.js';

import { UserAuthGuard } from './guards/user-auth.guard.js';

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: options.imports,
      providers: [UserAuthGuard],
      exports: [UserAuthGuard],
    };
  }
}
