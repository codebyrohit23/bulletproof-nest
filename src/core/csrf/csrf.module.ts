import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { CsrfGuard } from './guards/csrf.guard.js';

@Global()
@Module({
  providers: [{ provide: APP_GUARD, useClass: CsrfGuard }],
})
export class CsrfModule {}
