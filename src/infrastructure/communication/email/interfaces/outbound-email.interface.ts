import type { EmailDriver } from '#/config/email/index.js';

export interface EmailAddress {
  readonly address: string;

  readonly name?: string;
}

export interface EmailAttachment {
  readonly filename: string;

  readonly content: Buffer;

  readonly contentType?: string;
}

export interface OutboundEmail {
  readonly from: EmailAddress;

  readonly to: readonly EmailAddress[];

  readonly replyTo?: EmailAddress;

  readonly subject: string;

  readonly html: string;

  readonly text: string;

  readonly headers?: Readonly<Record<string, string>>;

  readonly attachments?: readonly EmailAttachment[];

  readonly idempotencyKey: string;
}

export interface EmailReceipt {
  readonly providerMessageId: string;

  readonly provider: EmailDriver;

  readonly acceptedAt: Date;
}
