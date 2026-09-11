import { Module } from '@nestjs/common';

import { AppConfigService } from '#/config/app/index.js';
import { EmailConfigService } from '#/config/email/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { EmailTransport } from './interfaces/index.js';
import { ResendClient } from './resend/resend.client.js';
import { createEmailTransport } from './utils/index.js';

/**
 * Binds the transport abstraction to one provider.
 *
 * This is the only place the two are named together. `core/communication/email`
 * imports this module and injects `EmailTransport`; nothing above ever mentions
 * an adapter, so a new provider is one arm of the switch in
 * `createEmailTransport`.
 *
 * The driver comes from configuration rather than from `NODE_ENV`, so local and
 * CI run `log` with no key, staging can run `resend` against a sandbox domain,
 * and the choice is visible in the environment rather than inferred.
 *
 * Not `@Global()`. `core/communication/email` is the single consumer and imports
 * it explicitly, which keeps the dependency visible — the same call
 * `CacheStoreModule` makes.
 */
@Module({
  providers: [
    ResendClient,
    {
      provide: EmailTransport,
      inject: [EmailConfigService, AppConfigService, ResendClient, AppLoggerService],
      useFactory: createEmailTransport,
    },
  ],
  exports: [EmailTransport],
})
export class EmailTransportModule {}
