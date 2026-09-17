import { type DynamicModule, Module } from '@nestjs/common';

import { EmailTransportModule } from '#/infrastructure/communication/email/index.js';

import type { EmailModuleOptions } from './interfaces/index.js';
import { EmailDeliveryJob } from './jobs/email-delivery.job.js';
import { EmailService } from './services/email.service.js';

/**
 * Everything a feature module needs to send email, and nothing it does not.
 *
 * Only `EmailService` is exported. The job is a provider so the queue's registry
 * discovers it at boot; it is not something anything else should hold. The
 * transport is not re-exported either — a module that could inject
 * `EmailTransport` could send an unrendered message straight past the templates.
 *
 * `EmailTransportModule` is imported explicitly rather than made global: this is
 * its only consumer, and the import is what makes the dependency visible.
 *
 * `forRoot` exists because sending now records what was sent, and the records
 * live in a feature module `core` cannot import. `global: true` for the same
 * reason `AuthModule` is: the recorder is wired here once, and a module that
 * imported the plain class instead would get a second copy of this one with no
 * recorder behind it.
 */
@Module({})
export class EmailModule {
  static forRoot(options: EmailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      global: true,
      imports: [EmailTransportModule, ...options.imports],
      providers: [EmailService, EmailDeliveryJob],
      exports: [EmailService],
    };
  }
}
