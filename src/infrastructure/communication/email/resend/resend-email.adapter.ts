import { Injectable } from '@nestjs/common';

import { EMAIL_DRIVER, type EmailDriver } from '#/config/email/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { EmailTransport, type EmailReceipt, type OutboundEmail } from '../interfaces/index.js';

import { ResendClient } from './resend.client.js';
import { RESEND_LOG_CONTEXT } from './resend.constants.js';
import { readMessageId, toResendRequest, toTransportError } from './resend.mapper.js';

@Injectable()
export class ResendEmailAdapter extends EmailTransport {
  readonly provider: EmailDriver = EMAIL_DRIVER.RESEND;

  constructor(
    private readonly client: ResendClient,
    private readonly logger: AppLoggerService,
  ) {
    super();
  }

  async send(email: OutboundEmail): Promise<EmailReceipt> {
    const result = await this.client.sendEmail(toResendRequest(email), email.idempotencyKey);

    if (result.status < 200 || result.status >= 300) {
      throw toTransportError(result.status, result.body);
    }

    const providerMessageId = readMessageId(result.body);

    this.logger.debug('Email accepted by Resend', {
      context: RESEND_LOG_CONTEXT,
      operation: 'send',
      metadata: {
        to: email.to.map((recipient) => recipient.address),
        subject: email.subject,
        providerMessageId,
      },
    });

    return {
      providerMessageId,
      provider: this.provider,
      acceptedAt: new Date(),
    };
  }
}
