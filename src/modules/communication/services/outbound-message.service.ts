import { Injectable } from '@nestjs/common';
import { MessageStatus, type Prisma } from '@prisma/client';

import {
  MESSAGE_CHANNEL,
  MessageRecorder,
  type MessageFailure,
  type MessageReceipt,
  type MessageRecipient,
  type RecordMessageInput,
} from '#/core/communication/index.js';

import {
  MESSAGE_CATEGORY_COLUMN,
  MESSAGE_CHANNEL_COLUMN,
  MESSAGE_ERROR_CODE_MAX_LENGTH,
  MESSAGE_ERROR_MESSAGE_MAX_LENGTH,
  MESSAGE_STATUS_RANK,
} from '../constants/index.js';
import { OutboundMessageRepository } from '../repositories/index.js';

@Injectable()
export class OutboundMessageService extends MessageRecorder {
  constructor(private readonly messages: OutboundMessageRepository) {
    super();
  }

  async record(input: RecordMessageInput): Promise<string> {
    const created = await this.messages.insertIfAbsent({
      channel: MESSAGE_CHANNEL_COLUMN[input.channel],
      category: MESSAGE_CATEGORY_COLUMN[input.category],
      templateKey: input.templateKey,
      recipient: this.normalizeRecipient(input),
      idempotencyKey: input.idempotencyKey,
      ...this.toRecipientColumns(input.recipientRef),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
    });

    if (created !== null) {
      return created;
    }

    const existing = await this.messages.findIdByIdempotencyKey(input.idempotencyKey);

    if (existing === null) {
      throw new Error(`Outbound message "${input.idempotencyKey}" conflicted but was not found`);
    }

    return existing;
  }

  async markSent(id: string, receipt: MessageReceipt): Promise<void> {
    await this.advance(id, MessageStatus.SENT, {
      provider: receipt.provider,
      providerMessageId: receipt.providerMessageId,
      sentAt: new Date(),
      attempts: { increment: 1 },
      failedAt: null,
      errorCode: null,
      errorMessage: null,
    });
  }

  async markExpired(id: string): Promise<void> {
    await this.advance(id, MessageStatus.EXPIRED, {});
  }

  async markFailed(id: string, failure: MessageFailure): Promise<void> {
    await this.advance(id, MessageStatus.FAILED, {
      errorMessage: failure.message.slice(0, MESSAGE_ERROR_MESSAGE_MAX_LENGTH),
      failedAt: new Date(),
      attempts: { increment: 1 },
      ...(failure.code !== undefined
        ? { errorCode: failure.code.slice(0, MESSAGE_ERROR_CODE_MAX_LENGTH) }
        : {}),
    });
  }

  private advance(
    id: string,
    status: MessageStatus,
    data: Prisma.OutboundMessageUncheckedUpdateInput,
  ): Promise<boolean> {
    return this.messages.advance(id, status, this.statusesBelow(status), data);
  }

  private statusesBelow(status: MessageStatus): MessageStatus[] {
    return Object.values(MessageStatus).filter(
      (candidate) => MESSAGE_STATUS_RANK[candidate] < MESSAGE_STATUS_RANK[status],
    );
  }

  private normalizeRecipient(input: RecordMessageInput): string {
    const recipient = input.recipient.trim();

    return input.channel === MESSAGE_CHANNEL.EMAIL ? recipient.toLowerCase() : recipient;
  }

  private toRecipientColumns(
    recipientRef: MessageRecipient | undefined,
  ): Pick<Prisma.OutboundMessageUncheckedCreateInput, 'recipientUserId' | 'recipientAdminId'> {
    if (recipientRef === undefined) {
      return {};
    }

    return 'userId' in recipientRef
      ? { recipientUserId: recipientRef.userId }
      : { recipientAdminId: recipientRef.adminId };
  }
}
