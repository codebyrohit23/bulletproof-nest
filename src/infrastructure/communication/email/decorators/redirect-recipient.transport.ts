import type { EmailDriver } from '#/config/email/index.js';
import type { AppLoggerService } from '#/core/logger/index.js';

import { EMAIL_ORIGINAL_TO_HEADER, EMAIL_TRANSPORT_LOG_CONTEXT } from '../constants/index.js';
import {
  EmailTransport,
  type EmailAddress,
  type EmailReceipt,
  type OutboundEmail,
} from '../interfaces/index.js';
import { summariseRecipients } from '../utils/index.js';

export class RedirectRecipientTransport extends EmailTransport {
  constructor(
    private readonly inner: EmailTransport,
    private readonly redirectTo: EmailAddress,
    private readonly logger: AppLoggerService,
  ) {
    super();
  }

  get provider(): EmailDriver {
    return this.inner.provider;
  }

  send(email: OutboundEmail): Promise<EmailReceipt> {
    const originalRecipients = email.to.map((recipient) => recipient.address);

    this.logger.debug('Redirecting email to the test inbox', {
      context: EMAIL_TRANSPORT_LOG_CONTEXT,
      operation: 'send',
      metadata: { redirectedTo: this.redirectTo.address, originalRecipients },
    });

    return this.inner.send({
      ...email,

      to: [this.redirectTo],

      subject: `[→ ${summariseRecipients(originalRecipients)}] ${email.subject}`,

      headers: {
        ...email.headers,
        [EMAIL_ORIGINAL_TO_HEADER]: originalRecipients.join(', '),
      },
    });
  }
}
