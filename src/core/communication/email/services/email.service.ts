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

/**
 * The only way to send an email, and the only thing a feature module needs to
 * know about email at all.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO `deliver()` HERE
 * ---------------------------------------------------------------------------
 * Rendering and transport live in `EmailDeliveryJob`, not on this class. A
 * public method that sends synchronously would eventually be called from a
 * request — it works in development, and it puts a Resend round trip on the
 * critical path of a signup. Leaving it off the service makes that impossible
 * rather than discouraged.
 *
 * So `send` enqueues and returns. It is not "fire and forget": `JobDispatcher`
 * defers to after the transaction commits, the job id deduplicates repeats, and
 * the queue owns retries.
 */
@Injectable()
export class EmailService {
  constructor(
    private readonly jobs: JobDispatcher,

    private readonly recorder: MessageRecorder,
  ) {}

  /**
   * `template` is a separate argument so TypeScript infers it before checking
   * `input.data` against that template's schema. Inside one object the two would
   * be inferred together and a mismatched payload would type-check.
   */
  async send<T extends EmailTemplateId>(
    template: T,
    input: SendEmailInput<EmailTemplateData<T>>,
  ): Promise<void> {
    /*
     * Validated here as well as in the worker, and the duplication is the point:
     * this raises in the request that caused the mistake, where a stack trace
     * names the caller. The worker's copy catches something different — data
     * that was fine when queued and no longer matches the schema deployed since.
     *
     * The compiler covers most of this already; what gets past it is data built
     * from a database row or a JSON body, where the type was a promise rather
     * than a check.
     */
    parseTemplateData(requireEmailTemplate(template), input.data);

    const to = typeof input.to === 'string' ? [input.to] : input.to;
    const [primaryRecipient] = to;

    if (primaryRecipient === undefined) {
      throw new Error(`No recipient for email template "${template}"`);
    }

    /*
     * Recorded before dispatch and inside whatever transaction the caller is in,
     * so the record and the write that caused it commit or roll back together.
     *
     * One row, addressed to the first recipient: every template here writes to
     * one person. Fanning out to a row per address is a campaign concern, and
     * belongs with the campaign that needs per-recipient delivery state.
     */
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
    };

    await this.jobs.dispatch(QUEUE.EMAIL, EMAIL_JOB.DELIVER, payload, {
      /*
       * BullMQ drops a second job with the same id while the first still exists,
       * so a double-submitted form cannot produce two emails. The provider's own
       * idempotency key covers the rest — a retry after a timeout, where the
       * first request may already have been accepted.
       */
      jobId: input.idempotencyKey,
    });
  }
}
