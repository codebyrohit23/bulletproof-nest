import { Injectable } from '@nestjs/common';

import { JobDispatcher, QUEUE } from '#/infrastructure/queue/index.js';

import { MESSAGE_CATEGORY, MESSAGE_CHANNEL } from '../../constants/index.js';
import { MessageRecorder } from '../../ports/message-recorder.port.js';
import { EMAIL_JOB, type EmailTemplateId } from '../constants/index.js';
import type { EmailDeliveryPayload, SendEmailInput } from '../interfaces/index.js';
import {
  parseTemplateData,
  requireEmailTemplate,
  type EmailTemplateData,
} from '../templates/template.registry.js';

@Injectable()
export class EmailService {
  constructor(
    private readonly jobs: JobDispatcher,

    private readonly recorder: MessageRecorder,
  ) {}

  async send<T extends EmailTemplateId>(
    template: T,
    input: SendEmailInput<EmailTemplateData<T>>,
  ): Promise<void> {
    parseTemplateData(requireEmailTemplate(template), input.data);

    const to = typeof input.to === 'string' ? [input.to] : input.to;
    const [primaryRecipient] = to;

    if (primaryRecipient === undefined) {
      throw new Error(`No recipient for email template "${template}"`);
    }

    const messageId = await this.recorder.record({
      channel: MESSAGE_CHANNEL.EMAIL,
      category: input.category ?? MESSAGE_CATEGORY.TRANSACTIONAL,
      templateKey: template,
      recipient: primaryRecipient,
      idempotencyKey: input.idempotencyKey,
      ...(input.recipientRef !== undefined ? { recipientRef: input.recipientRef } : {}),
    });

    const payload: EmailDeliveryPayload = {
      template,

      messageId,

      to,

      data: input.data,

      idempotencyKey: input.idempotencyKey,

      ...(input.replyTo !== undefined ? { replyTo: input.replyTo } : {}),

      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt.toISOString() } : {}),
    };

    await this.jobs.dispatch(QUEUE.EMAIL, EMAIL_JOB.DELIVER, payload, {
      jobId: input.idempotencyKey,

      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });
  }
}
