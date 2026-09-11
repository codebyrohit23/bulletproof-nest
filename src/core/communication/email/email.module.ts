import { Module } from '@nestjs/common';

import { EmailTransportModule } from '#/infrastructure/communication/email/index.js';

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
 */
@Module({
  imports: [EmailTransportModule],
  providers: [EmailService, EmailDeliveryJob],
  exports: [EmailService],
})
export class EmailModule {}
