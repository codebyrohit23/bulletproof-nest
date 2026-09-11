import { Global, Module } from '@nestjs/common';

import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';

@Global()
@Module({
  providers: [PasswordService, TokenService],
  exports: [PasswordService, TokenService],
})
export class SecurityModule {}
