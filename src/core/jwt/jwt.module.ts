import { Global, Module } from '@nestjs/common';

import { JwtSignerService } from './services/jwt-signer.service.js';
import { JwtVerifierService } from './services/jwt-verifier.service.js';
import { KeyStoreService } from './services/key-store.service.js';

@Global()
@Module({
  providers: [KeyStoreService, JwtSignerService, JwtVerifierService],
  exports: [JwtSignerService, JwtVerifierService],
})
export class JwtModule {}
