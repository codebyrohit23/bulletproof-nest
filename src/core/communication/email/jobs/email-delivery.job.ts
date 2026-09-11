import { EmailConfigService } from '#/config/email/index.js';
import { EmailTransport } from '#/infrastructure/communication/email/index.js';
import { JobHandler, type JobHandlerContract } from '#/infrastructure/queue/index.js';

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
  ) {}

  async handle(payload: EmailDeliveryPayload): Promise<void> {
    const rendered = await renderEmail(payload.template, payload.data);

    /*
     * The sender is resolved here rather than carried on the payload: it is
     * configuration, and a job queued before a domain change should go out from
     * the address that is correct now, not the one that was correct then.
     */
    const replyTo = payload.replyTo ?? this.config.replyTo;

    await this.transport.send({
      from: { address: this.config.from.address, name: this.config.from.name },

      to: payload.to.map((address) => ({ address })),

      ...(replyTo !== undefined ? { replyTo: { address: replyTo } } : {}),

      subject: rendered.subject,

      html: rendered.html,

      text: rendered.text,

      idempotencyKey: payload.idempotencyKey,
    });
  }
}
