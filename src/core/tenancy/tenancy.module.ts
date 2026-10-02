import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { WorkspaceGuard } from './guards/workspace.guard.js';
import type { TenancyModuleOptions } from './interfaces/index.js';

/**
 * Register after `AuthModule` in `AppModule`: global guards run in
 * registration order, and this one needs the user that auth puts in context.
 */
@Module({})
export class TenancyModule {
  static forRoot(options: TenancyModuleOptions): DynamicModule {
    return {
      module: TenancyModule,
      global: true,
      imports: options.imports,
      providers: [WorkspaceGuard, { provide: APP_GUARD, useExisting: WorkspaceGuard }],
    };
  }
}
