import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { EMAIL_DRIVER, type EmailDriver } from '#/config/email/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { EMAIL_TRANSPORT_LOG_CONTEXT } from '../constants/index.js';
import { EmailTransport, type EmailReceipt, type OutboundEmail } from '../interfaces/index.js';

@Injectable()
export class LogEmailAdapter extends EmailTransport {
  readonly provider: EmailDriver = EMAIL_DRIVER.LOG;

  constructor(private readonly logger: AppLoggerService) {
    super();
  }

  send(email: OutboundEmail): Promise<EmailReceipt> {
    this.logger.info(`Email suppressed by the "${EMAIL_DRIVER.LOG}" driver`, {
      context: EMAIL_TRANSPORT_LOG_CONTEXT,
      operation: 'send',
      metadata: {
        from: email.from.address,
        to: email.to.map((recipient) => recipient.address),
        subject: email.subject,
        idempotencyKey: email.idempotencyKey,
        text: email.text,
      },
    });

    return Promise.resolve({
      providerMessageId: `${EMAIL_DRIVER.LOG}_${randomUUID()}`,
      provider: this.provider,
      acceptedAt: new Date(),
    });
  }
}
