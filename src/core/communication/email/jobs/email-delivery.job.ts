import { EmailConfigService } from '#/config/email/index.js';
import { EmailTransport, EmailTransportError } from '#/infrastructure/communication/email/index.js';
import { JobHandler, type JobHandlerContract } from '#/infrastructure/queue/index.js';

import type { MessageFailure } from '../../interfaces/index.js';
import { MessageRecorder } from '../../ports/message-recorder.port.js';
import { EMAIL_JOB } from '../constants/index.js';
import type { EmailDeliveryPayload } from '../interfaces/index.js';
import { renderEmail } from '../templates/template.renderer.js';

/**
 * Renders the message and hands it to a provider — the half of sending that is
 * slow and allowed to fail.
 *
 * Idempotent by construction: it derives everything from the payload and writes
 * nothing, so a retry produces the same message. The provider drops the repeat
 * on `idempotencyKey`.
 *
 * Nothing is logged here on purpose. `JobRunner` already records start, finish
 * and failure, and the adapter records the provider's receipt — a third line
 * would say the same thing a third time.
 */
@JobHandler(EMAIL_JOB.DELIVER)
export class EmailDeliveryJob implements JobHandlerContract<EmailDeliveryPayload> {
  constructor(
    private readonly transport: EmailTransport,
    private readonly config: EmailConfigService,
    private readonly recorder: MessageRecorder,
  ) {}

  async handle(payload: EmailDeliveryPayload): Promise<void> {
    const rendered = await renderEmail(payload.template, payload.data);

    /*
     * The sender is resolved here rather than carried on the payload: it is
     * configuration, and a job queued before a domain change should go out from
     * the address that is correct now, not the one that was correct then.
     */
    const replyTo = payload.replyTo ?? this.config.replyTo;

    try {
      const receipt = await this.transport.send({
        from: { address: this.config.from.address, name: this.config.from.name },

        to: payload.to.map((address) => ({ address })),

        ...(replyTo !== undefined ? { replyTo: { address: replyTo } } : {}),

        subject: rendered.subject,

        html: rendered.html,

        text: rendered.text,

        idempotencyKey: payload.idempotencyKey,
      });

      await this.recorder.markSent(payload.messageId, {
        provider: receipt.provider,
        providerMessageId: receipt.providerMessageId,
      });
    } catch (error) {
      /*
       * Recorded on every attempt, and the error is re-thrown so the queue keeps
       * its retries. A later attempt that succeeds moves the record forward
       * again, because a status never walks backwards.
       *
       * If recording itself fails the job fails with it and runs again, which
       * can hand the provider a message it has already accepted — the transport
       * carries `idempotencyKey` for exactly that. A duplicate the provider will
       * drop is a better outcome than a record that stays wrong forever.
       */
      await this.recorder.markFailed(payload.messageId, toMessageFailure(error));

      throw error;
    }
  }
}

function toMessageFailure(error: unknown): MessageFailure {
  if (error instanceof EmailTransportError) {
    return { code: error.code, message: error.message };
  }

  return { message: error instanceof Error ? error.message : 'Email delivery failed' };
}
