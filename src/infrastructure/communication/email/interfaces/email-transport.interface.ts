import type { EmailDriver } from '#/config/email/index.js';

import type { EmailReceipt, OutboundEmail } from './outbound-email.interface.js';

export abstract class EmailTransport {
  abstract readonly provider: EmailDriver;

  abstract send(email: OutboundEmail): Promise<EmailReceipt>;
}
