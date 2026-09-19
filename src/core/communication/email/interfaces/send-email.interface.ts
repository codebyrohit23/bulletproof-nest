import type { MessageCategory } from '../../constants/index.js';
import type { MessageRecipient } from '../../interfaces/index.js';
import type { EmailTemplateId } from '../constants/index.js';

export interface SendEmailInput<TData> {
  readonly to: string | readonly string[];

  readonly data: TData;

  readonly idempotencyKey: string;

  readonly replyTo?: string;

  readonly recipientRef?: MessageRecipient;

  readonly category?: MessageCategory;

  readonly expiresAt?: Date;
}

export interface EmailDeliveryPayload {
  readonly template: EmailTemplateId;

  readonly messageId: string;

  readonly to: readonly string[];

  readonly data: unknown;

  readonly idempotencyKey: string;

  readonly replyTo?: string;

  readonly expiresAt?: string;
}
