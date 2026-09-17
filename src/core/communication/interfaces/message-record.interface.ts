import type { MessageCategory, MessageChannel } from '../constants/index.js';

export type MessageRecipient = { readonly userId: string } | { readonly adminId: string };

export interface RecordMessageInput {
  readonly channel: MessageChannel;

  readonly category: MessageCategory;

  readonly templateKey: string;

  readonly recipient: string;

  readonly recipientRef?: MessageRecipient;

  readonly subject?: string;

  readonly idempotencyKey: string;

  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MessageReceipt {
  readonly providerMessageId: string;

  readonly provider: string;
}

export interface MessageFailure {
  readonly code?: string;

  readonly message: string;
}
