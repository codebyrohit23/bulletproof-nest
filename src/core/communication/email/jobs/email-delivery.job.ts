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
    if (payload.expiresAt !== undefined && Date.parse(payload.expiresAt) <= Date.now()) {
      await this.recorder.markExpired(payload.messageId);

      return;
    }

    try {
      const rendered = await renderEmail(payload.template, payload.data);

      const replyTo = payload.replyTo ?? this.config.replyTo;

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
